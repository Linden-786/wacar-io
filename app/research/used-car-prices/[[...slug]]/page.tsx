import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BarChart, LineChart, Stat } from '@/components/charts'
import { MarketTable } from '@/components/market-table'
import { slug } from '@/lib/data/catalog'
import { findStoreModel, getStore, groupSummary, marketSummary, storeMakes, vocabulary, weeklySeries } from '@/lib/data/query'
import type { Listing } from '@/lib/data/types'
import { dateOf, money, num, pct } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
type Props = { params: { slug?: string[] } }
const BASE = '/research/used-car-prices'

function resolve(parts: string[] = []) {
  const [makeSlug, modelSlug, extra] = parts
  const make = makeSlug ? storeMakes().find((m) => slug(m) === makeSlug) : undefined
  if (makeSlug && !make) return null
  const model = make && modelSlug ? findStoreModel(make, modelSlug) : undefined
  if (modelSlug && !model) return null
  let trim: string | undefined, year: number | undefined
  if (extra && model) {
    if (/^\d{4}$/.test(extra)) year = Number(extra)
    else trim = model.trims.find((t) => slug(t.name) === extra)?.name
    if (!year && !trim) return null
  }
  return { make, model, trim, year }
}

export function generateMetadata({ params }: Props): Metadata {
  const r = resolve(params.slug)
  const name = r ? [r.year, r.make, r.model?.model, r.trim].filter(Boolean).join(' ') : ''
  return { title: name ? `Used ${name} prices` : 'Used car prices' }
}

export default function Research({ params }: Props) {
  const r = resolve(params.slug)
  if (!r) notFound()
  const store = getStore()
  const used = store.listings.filter((l: Listing) => l.condition !== 'new' && (!r.make || l.make === r.make) && (!r.model || l.model === r.model.model) && (!r.trim || l.trim === r.trim) && (!r.year || l.year === r.year))
  const all = marketSummary(used)
  const series = weeklySeries(used)
  const label = (d: number) => dateOf(d, { month: 'short', day: 'numeric' })
  const name = [r.year, r.make, r.model?.model, r.trim].filter(Boolean).join(' ') || 'car'
  const crumbs: [string, string][] = [['Used car prices', BASE]]
  if (r.make) crumbs.push([r.make, `${BASE}/${slug(r.make)}`])
  if (r.model) crumbs.push([r.model.model, `${BASE}/${slug(r.make!)}/${slug(r.model.model)}`])
  const here = r.model ? `${BASE}/${slug(r.make!)}/${slug(r.model.model)}` : ''
  const q = new URLSearchParams({ condition: 'Used,Certified' })
  if (r.make) q.set('make', r.make)
  if (r.model) q.set('model', r.model.model)
  if (r.trim) q.set('trim', r.trim)
  if (r.year) q.set('year', String(r.year))

  const children = !r.make
    ? groupSummary(used, (l) => l.make).map((x) => ({ ...x, href: `${BASE}/${slug(x.key)}` }))
    : !r.model
      ? groupSummary(used, (l) => l.model).map((x) => ({ ...x, href: `${BASE}/${slug(r.make!)}/${slug(x.key)}` }))
      : []
  const movers = !r.model ? groupSummary(used, (l) => `${l.make} ${l.model}`).filter((x) => x.active >= 15 && x.change30 != null).sort((a, b) => Math.abs(b.change30!) - Math.abs(a.change30!)).slice(0, 6).map((x) => { const m = vocabulary().find((d) => `${d.make} ${d.model}` === x.key)!; return { ...x, href: `${BASE}/${slug(m.make)}/${slug(m.model)}` } }) : []

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-6">
      <div>
        <nav className="text-sm text-muted-foreground">{crumbs.map(([text, href], i) => <span key={href}>{i > 0 && ' / '}<Link href={href} className="hover:underline">{text}</Link></span>)}</nav>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Used {name} prices</h1>
          <Button asChild size="sm" className="font-semibold"><Link href={`/search/listings?${q}`}>See {num(all.active)} for sale</Link></Button>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Asking prices from dealer listings over the last five months. Sold counts are estimated from listings leaving the market.{store.source === 'crawl' && ` Collected from dealer websites in the ${store.region} area since ${store.trackingSince}; trends before that date only reflect cars still for sale today.`}</p>
      </div>

      {all.active + all.sold30 === 0 ? <Card className="border-dashed p-8 text-center text-muted-foreground shadow-none">No used listings for this selection yet.</Card> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Average asking price" value={money(all.avgPrice)} sub={`${pct(all.change30)} in 30 days`} />
            <Stat label="Average miles" value={num(all.avgMiles)} sub={`median price ${money(all.medianPrice)}`} />
            <Stat label="For sale now" value={num(all.active)} sub={`${all.avgDays ?? '—'} days listed on average`} />
            <Stat label="Sold in 30 days" value={num(all.sold30)} sub={all.daysSupply == null ? '' : `${all.daysSupply} days of supply`} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-3 shadow-none"><h2 className="mb-1 text-sm font-semibold">Average asking price</h2><LineChart title="Average asking price by week" points={series.map((s) => ({ label: label(s.day), value: s.avgPrice }))} /></Card>
            <Card className="p-3 shadow-none"><h2 className="mb-1 text-sm font-semibold">Average miles</h2><LineChart kind="count" title="Average miles by week" points={series.map((s) => ({ label: label(s.day), value: s.avgMiles }))} /></Card>
            <Card className="p-3 shadow-none"><h2 className="mb-1 text-sm font-semibold">Inventory</h2><LineChart kind="count" title="Inventory by week" points={series.map((s) => ({ label: label(s.day), value: s.count }))} /></Card>
            <Card className="p-3 shadow-none"><h2 className="mb-1 text-sm font-semibold">Newly listed each week</h2><BarChart title="New listings by week" bars={series.map((s) => ({ label: label(s.day), value: s.listed }))} /></Card>
          </div>
        </>
      )}

      <MarketTable title="Biggest movers" first="Model" rows={movers} hide={['sell', 'supply']} />
      <MarketTable title={r.make ? `${r.make} models` : 'By make'} first={r.make ? 'Model' : 'Make'} rows={children} />
      {r.model && !r.trim && <MarketTable title="By trim" first="Trim" rows={groupSummary(used, (l) => l.trim).map((x) => ({ ...x, href: r.year ? undefined : `${here}/${slug(x.key)}` }))} />}
      {r.model && !r.year && <MarketTable title="By model year" first="Year" rows={groupSummary(used, (l) => String(l.year)).sort((a, b) => Number(b.key) - Number(a.key)).map((x) => ({ ...x, href: r.trim ? undefined : `${here}/${x.key}` }))} />}
      <MarketTable title="By fuel type" first="Fuel" rows={groupSummary(used, (l) => l.fuel)} hide={['sell']} />
      <MarketTable title="By state" first="State" rows={groupSummary(used, (_, d) => d.state).slice(0, 15)} hide={['sell', 'supply']} />
    </div>
  )
}
