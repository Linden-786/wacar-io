// Find out which dealer sites the crawler can read.
//   npx tsx crawler/probe.ts hosts.txt
// hosts.txt has one hostname per line (anything after " | " is ignored).
// Sites on a supported platform whose robots.txt allows inventory pages are
// written to crawler/dealers.json.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { isDealerCom } from './dealercom'
import { allowed, get, pool } from './http'

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('usage: tsx crawler/probe.ts <hosts file>')
  const hosts = Array.from(new Set(readFileSync(file, 'utf8').split('\n').map((l) => l.split('|')[0].trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter((h) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(h))))
  console.log(`Probing ${hosts.length} sites…`)
  const tally: Record<string, number> = {}
  const found = await pool(hosts, 12, async (host) => {
    let platform = 'unreachable'
    try {
      const res = await get(`https://${host}/`, 20000)
      const finalHost = new URL(res.url).host
      if (res.status !== 200) platform = `http-${res.status}`
      else if (isDealerCom(res.body)) platform = (await allowed(`https://${finalHost}/new-inventory/index.htm`)) ? 'dealer.com' : 'dealer.com-blocked-by-robots'
      else if (/dealeron/i.test(res.body)) platform = 'dealeron'
      else if (/dealerinspire/i.test(res.body)) platform = 'dealerinspire'
      else if (/teamvelocity|sincro|cdk/i.test(res.body)) platform = 'other-known'
      else platform = 'unknown'
      tally[platform] = (tally[platform] ?? 0) + 1
      return { host: finalHost, platform }
    } catch {
      tally[platform] = (tally[platform] ?? 0) + 1
      return { host, platform }
    }
  })
  const unique = Array.from(new Map(found.map((f) => [f.host, f])).values()).sort((a, b) => a.host.localeCompare(b.host))
  writeFileSync(path.join(__dirname, 'dealers.json'), JSON.stringify(unique, null, 1))
  console.log(tally)
  console.log(`${unique.filter((u) => u.platform === 'dealer.com').length} sites ready to crawl; all results in crawler/dealers.json`)
}

main().catch((e) => { console.error(e); process.exit(1) })
