// Polite HTTP for the crawler: one identifying user agent, robots.txt checks
// before every fetch, and a per-host delay so no dealer site sees a burst.

export const USER_AGENT = process.env.CRAWLER_USER_AGENT ?? 'Mozilla/5.0 (compatible; inventory-crawler/0.1)'
const BOT_TOKEN = 'inventory-crawler'
const DELAY_MS = Number(process.env.CRAWLER_DELAY_MS ?? 1500)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nextSlot = new Map<string, number>()

async function throttle(host: string) {
  const now = Date.now()
  const at = Math.max(now, nextSlot.get(host) ?? 0)
  nextSlot.set(host, at + DELAY_MS)
  if (at > now) await sleep(at - now)
}

export async function get(url: string, timeoutMs = 30000): Promise<{ status: number; body: string; url: string }> {
  await throttle(new URL(url).host)
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/json' }, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) })
  return { status: res.status, body: await res.text(), url: res.url }
}

// ---------------------------------------------------------------- robots.txt

interface Rule { allow: boolean; pattern: RegExp; length: number }
const robotsCache = new Map<string, Promise<Rule[] | null>>()

function toRegex(path: string) {
  const anchored = path.endsWith('$')
  const body = (anchored ? path.slice(0, -1) : path).split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')
  return new RegExp('^' + body + (anchored ? '$' : ''))
}

/** Rules that apply to this crawler: its own group if the site names it, otherwise the "*" group. */
export function parseRobots(text: string): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = []
  let cur: { agents: string[]; rules: Rule[] } | null = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1].toLowerCase(), value = m[2].trim()
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur) }
      cur.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else {
      lastWasAgent = false
      if (cur && (key === 'allow' || key === 'disallow') && value) cur.rules.push({ allow: key === 'allow', pattern: toRegex(value), length: value.length })
    }
  }
  const own = groups.filter((g) => g.agents.some((a) => a !== '*' && BOT_TOKEN.includes(a)))
  return (own.length ? own : groups.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules)
}

export function allowedBy(rules: Rule[], path: string) {
  let best: Rule | null = null
  for (const r of rules) if (r.pattern.test(path) && (!best || r.length > best.length || (r.length === best.length && r.allow))) best = r
  return !best || best.allow
}

/** True when the site's robots.txt lets this crawler fetch the URL. A site whose robots.txt cannot be read is skipped. */
export async function allowed(url: string): Promise<boolean> {
  const u = new URL(url)
  if (!robotsCache.has(u.host)) {
    robotsCache.set(u.host, get(`${u.protocol}//${u.host}/robots.txt`, 15000)
      .then((r) => (r.status === 404 ? [] : r.status >= 400 ? null : parseRobots(r.body)))
      .catch(() => null))
  }
  const rules = await robotsCache.get(u.host)!
  return rules != null && allowedBy(rules, u.pathname + u.search)
}

/** Run tasks with a fixed number in flight. */
export async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]) }
  }))
  return out
}
