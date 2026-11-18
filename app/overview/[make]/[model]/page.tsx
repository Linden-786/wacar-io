import { Suspense } from 'react'
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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const dynamic = 'force-dynamic'
type Props = { params: { make: string; model: string } }

export function generateMetadata({ params }: Props): Metadata {
  const m = findModel(params.make, params.model)
  return { title: m ? `${m.make} ${m.model} market overview` : 'Model not found' }
}

async function SafetyRows({ make, model, years }: { make: string; model: string; years: number[] }) {
  const nhtsa = await Promise.all(years.map(async (y) => ({ year: y, ...(await safety(make, model, y)) })))
  return <>{nhtsa.map((n) => <TableRow key={n.year}><TableCell className="font-medium">{n.year}</TableCell><TableCell className="text-right tabular-nums">{n.recalls?.length ?? 'unavailable'}</TableCell><TableCell className="text-right tabular-nums">{n.complaints?.toLocaleString('en-US') ?? 'unavailable'}</TableCell></TableRow>)}</>
}

export default function Overview({ params }: Props) {
  const m = findModel(params.make, params.model)
  if (!m) notFound()
  const rows = modelRows(m.make, m.model)
  const all = marketSummary(rows)
  const q = `make=${encodeURIComponent(m.make)}&model=${encodeURIComponent(m.model)}`
  const series = weeklySeries(rows)
  const latest = rows.filter((l) => l.status === 'active').sort((a, b) => a.daysListed - b.daysListed).slice(0, 4)
  const years = Array.from(new Set(rows.map((l) => l.year))).sort((a, b) => b - a)
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
          <Button asChild variant="outline" size="sm"><Link href={`/research/used-car-prices/${slug(m.make)}/${slug(m.model)}`}>Used price research</Link></Button>
          <Button asChild size="sm" className="font-semibold"><Link href={`/search/listings?${q}`}>See {num(all.active)} for sale</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="For sale now" value={num(all.active)} sub={`${num(all.newCount)} new · ${num(all.usedCount)} used`} />
        <Stat label="Average asking price" value={money(all.avgPrice)} sub={`${pct(all.change30)} in 30 days`} />
        <Stat label="Sold in 30 days" value={num(all.sold30)} sub={`${all.avgDaysToSell ?? '—'} days to sell`} />
        <Stat label="Market days supply" value={all.daysSupply == null ? '—' : String(all.daysSupply)} sub="at the current sales pace" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-3 shadow-none"><h2 className="mb-1 text-sm font-semibold">Inventory</h2><LineChart kind="count" title="Inventory over time" points={series.map((s) => ({ label: label(s.day), value: s.count }))} /></Card>
        <Card className="p-3 shadow-none"><h2 className="mb-1 text-sm font-semibold">Average asking price</h2><LineChart title="Average asking price over time" points={series.map((s) => ({ label: label(s.day), value: s.avgPrice }))} /></Card>
      </div>

      <MarketTable title="By generation" first="Generation" rows={groupSummary(rows, (l) => l.generation).sort((a, b) => b.key.localeCompare(a.key)).map((r) => ({ ...r, href: `/search/listings?${q}&generation=${encodeURIComponent(r.key)}` }))} hide={['miles', 'sell']} />
      <MarketTable title="By model year" first="Year" rows={groupSummary(rows, (l) => String(l.year)).sort((a, b) => Number(b.key) - Number(a.key)).map((r) => ({ ...r, href: `/search/listings?${q}&year=${r.key}` }))} hide={['change']} />
      <MarketTable title="By trim" first="Trim" rows={groupSummary(rows, (l) => l.trim).map((r) => ({ ...r, href: `/search/listings?${q}&trim=${encodeURIComponent(r.key)}` }))} hide={['sell']} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Safety record <span className="text-sm font-normal text-muted-foreground">from NHTSA</span></h2>
        <Card className="overflow-hidden shadow-none">
          <Table>
            <TableHeader className="bg-muted/50"><TableRow><TableHead>Model year</TableHead><TableHead className="text-right">Recalls</TableHead><TableHead className="text-right">Complaints</TableHead></TableRow></TableHeader>
            <TableBody><Suspense fallback={<TableRow><TableCell colSpan={3} className="text-muted-foreground">Loading NHTSA records…</TableCell></TableRow>}><SafetyRows make={m.make} model={m.model} years={years.slice(0, 4)} /></Suspense></TableBody>
          </Table>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Just listed</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{latest.map((l) => <VehicleCard key={l.vin} l={toView(l, null)} />)}</div>
      </section>
    </div>
  )
}
