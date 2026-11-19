// Guard for unattended crawls.
//   npx tsx crawler/check.ts --count     print how many cars are for sale in the snapshot
//   npx tsx crawler/check.ts <before>    exit 1 unless the fresh crawl is fit to publish:
//                                        at least 70% of sites read completely and at
//                                        least 70% of the previous number of cars
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import type { Snapshot } from './types'

const data = path.resolve(__dirname, '..', 'data')
const snap = JSON.parse(gunzipSync(readFileSync(path.join(data, 'inventory.json.gz'))).toString('utf8')) as Snapshot
const active = snap.listings.filter((l) => !l.goneOn).length

if (process.argv[2] === '--count') {
  console.log(active)
} else {
  const before = Number(process.argv[2] ?? 0)
  const report = JSON.parse(readFileSync(path.join(data, 'crawl-report.json'), 'utf8')) as { date: string; sites: { trusted: boolean }[] }
  const ok = report.sites.filter((s) => s.trusted).length
  console.log(`Cars for sale: ${before} -> ${active}. Sites read completely: ${ok}/${report.sites.length}.`)
  const problems: string[] = []
  // a crawl that runs past midnight UTC is still today's crawl
  if ((Date.now() - Date.parse(report.date)) / 86400000 > 1.5) problems.push(`the crawl report is dated ${report.date}; the crawl did not finish`)
  if (ok < report.sites.length * 0.7) problems.push('under 70% of sites could be read completely')
  if (active < before * 0.7) problems.push("under 70% of the previous day's cars came back")
  if (problems.length) { console.error(`Not publishing: ${problems.join('; ')}.`); process.exit(1) }
}
