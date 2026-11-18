// Crawl every dealer in crawler/dealers.json, merge with the previous
// snapshot (price history, cars that have gone), and write data/inventory.json.gz.
//   npx tsx crawler/run.ts            crawl everything
//   npx tsx crawler/run.ts --limit 3  crawl the first three dealers (for testing)
//   npx tsx crawler/run.ts --hosts a.com,b.com  crawl only these sites; the rest of the snapshot is kept as is
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'
import { crawlDealerCom } from './dealercom'
import { pool } from './http'
import type { RawDealer, RawListing, Snapshot, TrackedListing } from './types'
import { decodeVins } from './vpic'

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'data', 'inventory.json.gz')
const REPORT = path.join(ROOT, 'data', 'crawl-report.json')
const KEEP_GONE_DAYS = 150
const HOSTS_IN_PARALLEL = 6

const today = new Date().toISOString().slice(0, 10)
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
const key = (l: { vin: string; dealerId: string }) => `${l.vin}@${l.dealerId}`

async function main() {
  const limitArg = process.argv.indexOf('--limit')
  const all = JSON.parse(readFileSync(path.join(__dirname, 'dealers.json'), 'utf8')) as { host: string; platform: string }[]
  const hostsArg = process.argv.indexOf('--hosts')
  const only = hostsArg > 0 ? new Set(process.argv[hostsArg + 1].split(',')) : null
  const targets = (limitArg > 0 ? all.slice(0, Number(process.argv[limitArg + 1])) : all).filter((d) => d.platform === 'dealer.com' && (!only || only.has(d.host)))
  const prev: Snapshot = existsSync(OUT) ? JSON.parse(gunzipSync(readFileSync(OUT)).toString('utf8')) : { generatedAt: '', region: 'New York metro', dealers: [], listings: [] }

  console.log(`Crawling ${targets.length} dealer sites…`)
  const started = Date.now()
  let done = 0
  const results = await pool(targets, HOSTS_IN_PARALLEL, async (t) => {
    let r: Awaited<ReturnType<typeof crawlDealerCom>>
    try { r = await crawlDealerCom(t.host) } catch (e) { r = { dealers: [], listings: [], requests: 0, complete: false, note: String((e as Error).message ?? e) } }
    console.log(`  [${++done}/${targets.length}] ${t.host}: ${r.listings.length} cars, ${r.requests} requests${r.note ? ` (${r.note})` : ''}`)
    return { host: t.host, ...r }
  })

  // ---- merge with the previous snapshot
  const dealers = new Map<string, RawDealer>(prev.dealers.map((d) => [d.id, d]))
  const tracked = new Map<string, TrackedListing>(prev.listings.map((l) => [key(l), l]))
  const prevPerHost = new Map<string, number>()
  for (const l of prev.listings) if (!l.goneOn) { const h = l.dealerId.split('#')[0]; prevPerHost.set(h, (prevPerHost.get(h) ?? 0) + 1) }

  const report: { host: string; cars: number; requests: number; trusted: boolean; note?: string }[] = []
  for (const r of results) {
    // A crawl is trusted to say what has gone only if it finished and did not shrink implausibly.
    const before = prevPerHost.get(r.host) ?? 0
    const trusted = r.complete && r.listings.length > 0 && r.listings.length >= before * 0.5
    report.push({ host: r.host, cars: r.listings.length, requests: r.requests, trusted, note: r.note })
    for (const d of r.dealers) dealers.set(d.id, d)
    const seen = new Set<string>()
    for (const l of r.listings) {
      seen.add(key(l))
      const old = tracked.get(key(l))
      if (!old) {
        const firstSeen = l.listedOn && l.listedOn <= today ? l.listedOn : today
        tracked.set(key(l), { ...l, firstSeen, lastSeen: today, goneOn: null, history: l.price != null ? [[firstSeen, l.price, l.miles]] : [], decoded: null })
      } else {
        const history = old.history
        const last = history[history.length - 1]
        if (l.price != null && (!last || last[1] !== l.price)) history.push([today, l.price, l.miles])
        tracked.set(key(l), { ...old, ...(l as RawListing), firstSeen: old.firstSeen, lastSeen: today, goneOn: null, history, decoded: old.decoded })
      }
    }
    if (trusted) for (const l of tracked.values()) if (l.dealerId.startsWith(`${r.host}#`) && !l.goneOn && !seen.has(key(l))) l.goneOn = today
  }
  for (const [k, l] of tracked) if (l.goneOn && daysBetween(l.goneOn, today) > KEEP_GONE_DAYS) tracked.delete(k)

  // ---- decode VINs not decoded before
  const need = Array.from(new Set(Array.from(tracked.values()).filter((l) => !l.decoded).map((l) => l.vin)))
  if (need.length) {
    console.log(`Decoding ${need.length} VINs…`)
    const decoded = await decodeVins(need, (n) => { if (n % 1000 < 50) console.log(`  ${n}/${need.length}`) })
    for (const l of tracked.values()) if (!l.decoded) l.decoded = decoded.get(l.vin) ?? null
  }

  const listings = Array.from(tracked.values()).sort((a, b) => key(a).localeCompare(key(b)))
  const used = new Set(listings.map((l) => l.dealerId))
  const snapshot: Snapshot = { generatedAt: new Date().toISOString(), region: 'New York metro', dealers: Array.from(dealers.values()).filter((d) => used.has(d.id)).sort((a, b) => a.id.localeCompare(b.id)), listings }
  mkdirSync(path.dirname(OUT), { recursive: true })
  writeFileSync(OUT, gzipSync(JSON.stringify(snapshot)))
  if (!only) writeFileSync(REPORT, JSON.stringify({ date: today, minutes: Math.round((Date.now() - started) / 6000) / 10, sites: report }, null, 1))
  const active = listings.filter((l) => !l.goneOn).length
  console.log(`Done: ${active} cars for sale, ${listings.length - active} gone, ${snapshot.dealers.length} dealers, ${report.filter((r) => !r.trusted).length} sites incomplete.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
