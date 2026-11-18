import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Stat } from '@/components/charts'
import { SearchBox } from '@/components/search-box'
import { VehicleCard } from '@/components/vehicle-card'
import { slug } from '@/lib/data/catalog'
import { getStore, groupSummary, marketSummary, toView } from '@/lib/data/query'
import { money, num, pct } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const QUICK: [string, string][] = [
  ['Used SUVs under $30k', 'condition=Used,Certified&body=SUV&price_max=30000'],
  ['New hybrids', 'condition=New&fuel=Hybrid,Plug-in+Hybrid'],
  ['Manual transmission', 'transmission=Manual'],
  ['Electric under $35k', 'fuel=Electric&price_max=35000'],
  ['Trucks with a V8', 'body=Pickup&cylinders=8'],
  ['Biggest discounts on new', 'condition=New&sort=discount'],
]

export default function Home() {
  const store = getStore()
  const { listings } = store
  const all = marketSummary(listings)
  const active = listings.filter((l) => l.status === 'active')
  const models = groupSummary(listings, (l) => `${l.make}|${l.model}`).filter((m) => m.active >= 25)
  const drops = [...models].filter((m) => m.change30 != null).sort((a, b) => a.change30! - b.change30!).slice(0, 4)
  const fastest = [...models].filter((m) => m.daysSupply != null).sort((a, b) => a.daysSupply! - b.daysSupply!).slice(0, 4)
  const newCars = active.filter((l) => l.condition === 'new')
  // Trends and sold counts need a month of daily crawls behind them; until then show what is known today.
  const young = store.source === 'crawl' && (Date.now() - Date.parse(store.trackingSince!)) / 86400000 < 30
  const thisWeek = active.filter((l) => l.daysListed <= 7)
  const weekByModel = new Map<string, number>()
  for (const l of thisWeek) weekByModel.set(`${l.make}|${l.model}`, (weekByModel.get(`${l.make}|${l.model}`) ?? 0) + 1)
  const mostListed = [...models].sort((a, b) => b.active - a.active).slice(0, 4)
  const newest = [...models].filter((m) => weekByModel.has(m.key)).sort((a, b) => weekByModel.get(b.key)! - weekByModel.get(a.key)!).slice(0, 4)
  const notOnLot = newCars.filter((l) => l.availability !== 'On lot').length

  const fresh = active.filter((l) => l.price != null)
  const deals = fresh.filter((l) => l.condition === 'new').sort((a, b) => (b.msrp - b.price!) / b.msrp - (a.msrp - a.price!) / a.msrp).slice(0, 4)
  const rare = fresh.filter((l) => ['Purple', 'Yellow', 'Orange', 'Brown', 'Green'].includes(l.extColor) && l.transmission === 'Manual').sort((a, b) => a.daysListed - b.daysListed).slice(0, 4)
  const cuts = fresh.filter((l) => l.history.length >= 4).sort((a, b) => (a.price! - a.history[0].price) / a.history[0].price - (b.price! - b.history[0].price) / b.history[0].price).slice(0, 4)

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-14 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">Every car for sale, with the story behind its price</h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">{store.source === 'crawl' ? `Search real dealer inventory in the ${store.region} area.` : 'Search dealer inventory nationwide.'} See how long a car has sat, every price change, what options it was built with, and how it ranks against the same car elsewhere.</p>
          <div className="mx-auto mt-7 max-w-2xl text-left"><SearchBox large /></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {QUICK.map(([label, q]) => <Button key={label} asChild variant="outline" size="sm" className="h-8 rounded-full bg-background font-normal"><Link href={`/search/listings?${q}`}>{label}</Link></Button>)}
            <Button asChild size="sm" className="h-8 rounded-full"><Link href="/search/filters">All filters</Link></Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-12 px-4 py-10">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Market snapshot</h2>
            <Button asChild variant="link" size="sm" className="h-auto p-0"><Link href="/research/used-car-prices">Price research <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="For sale now" value={num(all.active)} sub={`${num(all.newCount)} new · ${num(all.usedCount)} used`} />
            <Stat label="Average asking price" value={money(all.avgPrice)} sub={young ? 'across every listing with a price' : `${pct(all.change30)} in 30 days`} />
            {young
              ? <Stat label="Listed in the last 7 days" value={num(thisWeek.length)} sub={`sold counts start ${new Date(`${store.trackingSince}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} />
              : <Stat label="Sold in the last 30 days" value={num(all.sold30)} sub={`${all.avgDaysToSell ?? '—'} days to sell on average`} />}
            {store.source === 'crawl'
              ? <Stat label="Dealers tracked" value={num(store.dealers.length)} sub={`${store.region} · updated ${new Date(store.generatedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}`} />
              : <Stat label="New cars not yet on the lot" value={`${Math.round((notOnLot / Math.max(1, newCars.length)) * 100)}%`} sub="in transit or in production" />}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(young ? [
              { title: 'Most cars for sale', rows: mostListed.map((m) => ({ key: m.key, right: num(m.active), sub: `avg ${money(m.avgPrice)}` })) },
              { title: 'Most new arrivals this week', rows: newest.map((m) => ({ key: m.key, right: num(weekByModel.get(m.key)!), sub: `of ${num(m.active)} for sale` })) },
            ] : [
              { title: 'Prices falling fastest (30 days)', rows: drops.map((m) => ({ key: m.key, right: pct(m.change30), sub: `avg ${money(m.avgPrice)}` })) },
              { title: 'Selling fastest (days of supply)', rows: fastest.map((m) => ({ key: m.key, right: `${m.daysSupply} days`, sub: `${m.sold30} sold in 30 days` })) },
            ]).map((card) => (
              <Card key={card.title} className="shadow-none">
                <CardHeader className="p-4 pb-0"><CardTitle className="text-sm">{card.title}</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                <ul className="divide-y text-sm">
                  {card.rows.map((r) => {
                    const [make, model] = r.key.split('|')
                    return (
                      <li key={r.key} className="flex items-center justify-between gap-3 py-2">
                        <Link href={`/overview/${slug(make)}/${slug(model)}`} className="font-medium hover:underline">{make} {model}</Link>
                        <span className="text-right"><span className="font-semibold tabular-nums">{r.right}</span><span className="ml-2 text-xs text-muted-foreground">{r.sub}</span></span>
                      </li>
                    )
                  })}
                </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {[
          { title: 'Deepest discounts from MSRP', badge: 'new cars priced furthest below sticker', items: deals, href: '/search/listings?condition=New&sort=discount' },
          { title: 'Rare specs', badge: 'manual gearbox in an uncommon color', items: rare, href: '/search/listings?transmission=Manual&ext_color=Purple,Yellow,Orange,Brown,Green' },
          { title: 'Most price cuts', badge: 'sellers who keep lowering the number', items: cuts, href: '/search/listings?days_min=60&sort=oldest' },
        ].filter((s) => s.items.length).map((s) => (
          <section key={s.title}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">{s.title} <span className="ml-1 text-sm font-normal text-muted-foreground">{s.badge}</span></h2>
              <Button asChild variant="link" size="sm" className="h-auto shrink-0 p-0"><Link href={s.href}>See all</Link></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{s.items.map((l) => <VehicleCard key={l.vin} l={toView(l, null)} />)}</div>
          </section>
        ))}

        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Research a model</h2>
          <div className="flex flex-wrap gap-2">
            {models.slice(0, 24).map((m) => {
              const [make, model] = m.key.split('|')
              return <Button key={m.key} asChild variant="outline" size="sm" className="font-normal"><Link href={`/overview/${slug(make)}/${slug(model)}`}>{make} {model} <span className="ml-1.5 tabular-nums text-muted-foreground">{num(m.active)}</span></Link></Button>
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
