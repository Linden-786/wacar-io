import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LineChart, Stat } from '@/components/charts'
import { MarketTable } from '@/components/market-table'
import { VehicleCard } from '@/components/vehicle-card'
import { findModel, slug } from '@/lib/data/catalog'
import { safety } from '@/lib/data/nhtsa'
import { groupSummary, marketSummary, modelRows, toView, weeklySeries } from '@/lib/data/query'
import { dateOf, money, num, pct } from '@/lib/format'

export const dynamic = 'force-dynamic'
type Props = { params: { make: string; model: string } }

export function generateMetadata({ params }: Props): Metadata {
  const m = findModel(params.make, params.model)
  return { title: m ? `${m.make} ${m.model} market overview` : 'Model not found' }
}

export default async function Overview({ params }: Props) {
  const m = findModel(params.make, params.model)
  if (!m) notFound()
  const rows = modelRows(m.make, m.model)
  const all = marketSummary(rows)
  const q = `make=${encodeURIComponent(m.make)}&model=${encodeURIComponent(m.model)}`
  const series = weeklySeries(rows)
  const latest = rows.filter((l) => l.status === 'active').sort((a, b) => a.daysListed - b.daysListed).slice(0, 4)
  const years = Array.from(new Set(rows.map((l) => l.year))).sort((a, b) => b - a)
  const nhtsa = await Promise.all(years.slice(0, 4).map(async (y) => ({ year: y, ...(await safety(m.make, m.model, y)) })))
  const label = (d: number) => dateOf(d, { month: 'short', day: 'numeric' })

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Market overview</p>
          <h1 className="text-3xl font-bold tracking-tight">{m.make} {m.model}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{m.body} · {m.seats} seats · assembled in {m.plant}, {m.country}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/research/used-car-prices/${slug(m.make)}/${slug(m.model)}`} className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-secondary">Used price research</Link>
          <Link href={`/search/listings?${q}`} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">See {num(all.active)} for sale</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="For sale now" value={num(all.active)} sub={`${num(all.newCount)} new · ${num(all.usedCount)} used`} />
        <Stat label="Average asking price" value={money(all.avgPrice)} sub={`${pct(all.change30)} in 30 days`} />
        <Stat label="Sold in 30 days" value={num(all.sold30)} sub={`${all.avgDaysToSell ?? '—'} days to sell`} />
        <Stat label="Market days supply" value={all.daysSupply == null ? '—' : String(all.daysSupply)} sub="at the current sales pace" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3"><h2 className="mb-1 text-sm font-semibold">Inventory</h2><LineChart kind="count" title="Inventory over time" points={series.map((s) => ({ label: label(s.day), value: s.count }))} /></div>
        <div className="rounded-lg border bg-card p-3"><h2 className="mb-1 text-sm font-semibold">Average asking price</h2><LineChart title="Average asking price over time" points={series.map((s) => ({ label: label(s.day), value: s.avgPrice }))} /></div>
      </div>

      <MarketTable title="By generation" first="Generation" rows={groupSummary(rows, (l) => l.generation).sort((a, b) => b.key.localeCompare(a.key)).map((r) => ({ ...r, href: `/search/listings?${q}&generation=${encodeURIComponent(r.key)}` }))} hide={['miles', 'sell']} />
      <MarketTable title="By model year" first="Year" rows={groupSummary(rows, (l) => String(l.year)).sort((a, b) => Number(b.key) - Number(a.key)).map((r) => ({ ...r, href: `/search/listings?${q}&year=${r.key}` }))} hide={['change']} />
      <MarketTable title="By trim" first="Trim" rows={groupSummary(rows, (l) => l.trim).map((r) => ({ ...r, href: `/search/listings?${q}&trim=${encodeURIComponent(r.key)}` }))} hide={['sell']} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Safety record <span className="text-sm font-normal text-muted-foreground">from NHTSA</span></h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left font-medium">Model year</th><th className="px-3 py-2 text-right font-medium">Recalls</th><th className="px-3 py-2 text-right font-medium">Complaints</th></tr></thead>
            <tbody>{nhtsa.map((n) => <tr key={n.year} className="border-t"><td className="px-3 py-2 font-medium">{n.year}</td><td className="px-3 py-2 text-right tabular-nums">{n.recalls?.length ?? 'unavailable'}</td><td className="px-3 py-2 text-right tabular-nums">{n.complaints?.toLocaleString('en-US') ?? 'unavailable'}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Just listed</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{latest.map((l) => <VehicleCard key={l.vin} l={toView(l, null)} />)}</div>
      </section>
    </div>
  )
}
