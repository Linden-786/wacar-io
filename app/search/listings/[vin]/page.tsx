import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VehiclePhoto } from '@/components/vehicle-photo'
import { Scatter } from '@/components/charts'
import { ListingActions, ListingTabs } from '@/components/listing-tabs'
import { Tags } from '@/components/vehicle-card'
import { slug } from '@/lib/data/catalog'
import { encodeValue } from '@/lib/data/filters'
import { safety } from '@/lib/data/nhtsa'
import { comparables, getStore, shortCode, stats, toView } from '@/lib/data/query'
import { ago, miles, money, signedMoney } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

const find = (vin: string) => getStore().byVin.get(vin.toUpperCase())

export function generateMetadata({ params }: { params: { vin: string } }): Metadata {
  const l = find(params.vin)
  return { title: l ? `${l.year} ${l.make} ${l.model} ${l.trim} · ${l.vin}` : 'Listing not found' }
}

async function SafetyPanel({ make, model, year }: { make: string; model: string; year: number }) {
  const s = await safety(make, model, year)
  if (s.recalls == null && s.complaints == null) return <p className="text-sm text-muted-foreground">NHTSA data is unavailable right now.</p>
  return (
    <div>
      <p className="text-sm">
        <strong className="tabular-nums">{s.recalls?.length ?? '—'}</strong> recall{s.recalls?.length === 1 ? '' : 's'} and <strong className="tabular-nums">{s.complaints?.toLocaleString('en-US') ?? '—'}</strong> owner complaints on file with NHTSA for the {year} {make} {model}. Recalls apply to the model year, not necessarily this VIN; a dealer can confirm open recalls.
      </p>
      {!!s.recalls?.length && (
        <ul className="mt-3 space-y-2">
          {s.recalls.slice(0, 6).map((r) => (
            <li key={r.id}><Card className="p-3 text-sm shadow-none">
              <div className="font-medium">{r.component} <span className="font-normal text-muted-foreground">· {r.id} · {r.date}</span></div>
              <details className="mt-1 text-muted-foreground"><summary className="cursor-pointer text-xs text-primary">Details</summary><p className="mt-1">{r.summary}</p><p className="mt-1"><strong className="text-foreground">Remedy:</strong> {r.remedy}</p></details>
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ListingPage({ params }: { params: { vin: string } }) {
  const raw = find(params.vin)
  if (!raw) notFound()
  const l = toView(raw, null)
  const store = getStore()
  const peers = comparables(raw, { trim: true, year: true, miles: false, local: false, sold: false })
  const market = store.listings.filter((x) => x.make === l.make && x.model === l.model && x.status === 'active' && x.price != null && (x.condition === 'new') === (l.condition === 'new') && x.vin !== l.vin)
  const typicalDoc = stats(store.dealers.filter((d) => d.state === l.dealer.state).map((d) => d.docFee))?.median ?? 400
  const crawled = store.source === 'crawl'
  // dealers publish MSRP for new cars only; a used car's "retail value" is not a sticker price
  const showMsrp = !crawled || (l.condition === 'new' && l.msrp > 0 && l.msrp !== l.price)
  const changes = Math.max(0, l.history.length - 1)
  const optionTotal = l.options.reduce((s, o) => s + o.price, 0)
  const specs: [string, string][] = [
    ['VIN', l.vin], ['Stock #', l.stock], ['Exterior', `${l.extColorName} (${l.extColor})`], ['Interior', l.intColor],
    ['Body style', `${l.body} · ${l.doors} doors · ${l.seats} seats`], ['Engine', l.engine], ['Transmission', l.transmission],
    ['Drivetrain', l.drivetrain], ['Fuel', `${l.fuel} (${l.powertrain})`], ...(l.generation ? [['Generation', l.generation] as [string, string]] : []),
    ['Assembly', `${l.plant}, ${l.country}`], ['Title', l.title], ['Previous use', l.prevUse], ['Availability', l.availability],
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <nav className="text-sm text-muted-foreground">
        <Link href={`/search/listings?make=${encodeURIComponent(l.make)}`} className="hover:underline">{l.make}</Link> / <Link href={`/overview/${slug(l.make)}/${slug(l.model)}`} className="hover:underline">{l.model}</Link> / <Link href={`/search/listings?make=${encodeURIComponent(l.make)}&model=${encodeURIComponent(l.model)}&trim=${encodeURIComponent(l.trim)}`} className="hover:underline">{l.trim}</Link>
      </nav>

      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <VehiclePhoto eager photo={l.photo} body={l.body} color={l.extColor} alt={`${l.year} ${l.make} ${l.model} ${l.trim}`} className={l.photo ? 'aspect-[16/10] w-full rounded-lg border' : 'aspect-[212/92] w-full rounded-lg border'} />
          <p className="mt-1 text-xs text-muted-foreground">{l.photo ? `Photo from ${l.dealer.name}.` : 'Illustration only: no photo is available for this listing.'}</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{l.year} {l.make} {l.model} <span className="text-muted-foreground">{l.version}</span></h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Tags l={l} />
            {l.certProgram && <Badge variant="outline" className="border-primary/40 text-primary">{l.certProgram}</Badge>}
            <span className="tabular-nums text-muted-foreground">{miles(l.miles)} · listed {ago(l.daysListed)}</span>
          </div>
          <div className="mt-4"><ListingActions vin={l.vin} shareUrl={`/v/${shortCode(l.vin)}`} /></div>
        </div>

        <aside className="space-y-4">
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{l.status === 'sold' ? 'Last asking price' : 'Asking price'} · before tax and registration</div>
            <div className="text-3xl font-bold tabular-nums">{l.price == null ? 'No price yet' : money(l.price)}</div>
            <dl className="mt-3 space-y-1 text-sm">
              {showMsrp && <div className="flex justify-between"><dt className="text-muted-foreground">MSRP with options</dt><dd className="tabular-nums">{money(l.msrp)}</dd></div>}
              {showMsrp && l.price != null && <div className="flex justify-between"><dt className="text-muted-foreground">vs. MSRP</dt><dd className="tabular-nums">{signedMoney(l.price - l.msrp)} ({l.discount! > 0 ? '−' : '+'}{Math.abs(l.discount!).toFixed(1)}%)</dd></div>}
              {peers.stats && l.price != null && <div className="flex justify-between"><dt className="text-muted-foreground">vs. comparable median</dt><dd className="tabular-nums">{signedMoney(l.price - peers.stats.median)}</dd></div>}
              {peers.rank > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Price rank</dt><dd className="tabular-nums">#{peers.rank} of {peers.total} {crawled ? 'in the area' : 'nationwide'}</dd></div>}
            </dl>
            <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
              {l.status === 'sold' ? `Sold ${ago(l.soldDay!)} after ${l.daysListed - l.soldDay!} days for sale` : `Listed for ${l.daysListed} day${l.daysListed === 1 ? '' : 's'}`}
              {l.price == null ? '.' : changes === 0 ? ' with no price changes.' : ` with ${changes} price change${changes === 1 ? '' : 's'}, ${signedMoney(l.price - l.history[0].price)} overall.`}
            </p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-sm">
            <div className="text-xs text-muted-foreground">Seller</div>
            <Link href={`/search/listings?dealer=${encodeURIComponent(encodeValue(l.dealer.name))}`} className="font-semibold hover:underline">{l.dealer.name}</Link>
            <div className="text-muted-foreground">{l.dealer.address}, {l.dealer.city}, {l.dealer.state} {l.dealer.zip}</div>
            <div className="text-muted-foreground">{l.dealer.phone}{crawled ? '' : ` · ${l.dealer.type}`}{l.dealer.group ? ` · ${l.dealer.group}` : ''}</div>
            {l.url && <Button asChild size="sm" className="mt-3 w-full"><a href={l.url} target="_blank" rel="noopener noreferrer nofollow">View on dealer site <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button>}
          </CardContent></Card>
        </aside>
      </div>

      <section className="mt-8"><ListingTabs l={l} median={peers.stats?.median ?? null} typicalDoc={typicalDoc} /></section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">Specifications</h2>
          <Card className="mt-3 shadow-none"><dl className="divide-y text-sm">
            {specs.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className={k === 'VIN' ? 'font-mono' : 'text-right'}>{v}</dd></div>)}
          </dl></Card>
        </section>
        <div className="space-y-8">
          {(!crawled || l.options.length > 0) && <section>
            <h2 className="text-lg font-semibold">Installed options</h2>
            {!l.options.length ? <p className="mt-3 text-sm text-muted-foreground">No factory options beyond the {l.trim} trim.</p> : (
              <Card className="mt-3 overflow-hidden shadow-none"><dl className="divide-y text-sm">
                <div className="flex justify-between px-3 py-2"><dt>{l.trim} base MSRP</dt><dd className="tabular-nums">{money(l.baseMsrp)}</dd></div>
                {l.options.map((o) => <div key={o.code} className="flex justify-between px-3 py-2"><dt><span className="mr-2 font-mono text-xs text-muted-foreground">{o.code}</span>{o.name}</dt><dd className="tabular-nums">{money(o.price)}</dd></div>)}
                <div className="flex justify-between px-3 py-2"><dt>Destination</dt><dd className="tabular-nums">{money(l.msrp - l.baseMsrp - optionTotal)}</dd></div>
                <div className="flex justify-between bg-muted/40 px-3 py-2 font-semibold"><dt>Total MSRP</dt><dd className="tabular-nums">{money(l.msrp)}</dd></div>
              </dl></Card>
            )}
            {!!l.features.length && <div className="mt-3 flex flex-wrap gap-1.5">{l.features.map((f) => <Link key={f} href={`/search/listings?make=${encodeURIComponent(l.make)}&model=${encodeURIComponent(l.model)}&feature=${encodeURIComponent(f)}`} ><Badge variant="outline" className="font-normal hover:border-primary">{f}</Badge></Link>)}</div>}
          </section>}
          <section>
            <h2 className="text-lg font-semibold">Where it sits in the market</h2>
            <p className="text-sm text-muted-foreground">Every {l.condition === 'new' ? 'new' : 'used'} {l.make} {l.model} for sale, price against mileage. This listing is highlighted.</p>
            <Card className="mt-2 p-2 shadow-none"><Scatter title={`${l.make} ${l.model} price vs. mileage`} points={market.map((x) => ({ miles: x.miles, price: x.price! }))} highlight={l.price != null ? { miles: l.miles, price: l.price } : undefined} /></Card>
          </section>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recalls and complaints</h2>
        <div className="mt-3"><Suspense fallback={<Skeleton className="h-16" />}><SafetyPanel make={l.make} model={l.model} year={l.year} /></Suspense></div>
      </section>
    </div>
  )
}
