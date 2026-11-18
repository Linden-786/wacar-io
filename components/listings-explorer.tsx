'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, Table2 } from 'lucide-react'
import { ActiveChips, SaveSearch, useQuery } from '@/components/filter-bits'
import type { Pin } from '@/components/listings-map'
import { CardActions, Tags, VehicleCard } from '@/components/vehicle-card'
import { useHidden, usePref } from '@/lib/client-store'
import { SORTS, filterParams, summarize, toggleValue } from '@/lib/data/filters'
import type { ListingView, RangeStats } from '@/lib/data/types'
import { ago, compactMoney, compactNum, miles, money, num } from '@/lib/format'
import { cn } from '@/lib/utils'

const ListingsMap = dynamic(() => import('@/components/listings-map'), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted" /> })

interface Heat { priceEdges: number[]; mileEdges: number[]; cells: number[][]; max: number }
interface Page { total: number; items: ListingView[]; origin: { label: string } | null; stats: { price: RangeStats | null; miles: RangeStats | null; days: RangeStats | null }; heat?: Heat | null }

const PAGE = 24

function Heatmap({ heat, params, onChange }: { heat: Heat; params: URLSearchParams; onChange: (p: URLSearchParams) => void }) {
  const [drag, setDrag] = useState<{ r: number; c: number } | null>(null)
  const [over, setOver] = useState<{ r: number; c: number } | null>(null)
  const rowsN = heat.cells.length, cols = heat.cells[0].length
  const inBox = (r: number, c: number) => drag && over && r >= Math.min(drag.r, over.r) && r <= Math.max(drag.r, over.r) && c >= Math.min(drag.c, over.c) && c <= Math.max(drag.c, over.c)
  const picked = (r: number, c: number) => {
    const pMin = Number(params.get('price_min') ?? -1), pMax = Number(params.get('price_max') ?? Infinity)
    const mMin = Number(params.get('miles_min') ?? -1), mMax = Number(params.get('miles_max') ?? Infinity)
    const any = ['price_min', 'price_max', 'miles_min', 'miles_max'].some((k) => params.get(k))
    return any && heat.priceEdges[r] >= pMin && heat.priceEdges[r + 1] <= pMax && heat.mileEdges[c] >= mMin && heat.mileEdges[c + 1] <= mMax
  }
  const commit = (a: { r: number; c: number }, b: { r: number; c: number }) => {
    const next = new URLSearchParams(params)
    next.set('price_min', String(heat.priceEdges[Math.min(a.r, b.r)]))
    next.set('price_max', String(heat.priceEdges[Math.max(a.r, b.r) + 1]))
    next.set('miles_min', String(heat.mileEdges[Math.min(a.c, b.c)]))
    next.set('miles_max', String(heat.mileEdges[Math.max(a.c, b.c) + 1]))
    onChange(next)
  }
  return (
    <div className="select-none" onMouseLeave={() => { setDrag(null); setOver(null) }}>
      <div className="grid gap-px" style={{ gridTemplateColumns: `auto repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: rowsN }, (_, i) => rowsN - 1 - i).map((r) => (
          <div key={r} className="contents">
            <div className="pr-1.5 text-right text-[10px] leading-6 tabular-nums text-muted-foreground">{compactMoney(heat.priceEdges[r])}</div>
            {heat.cells[r].map((count, c) => (
              <button
                key={c}
                type="button"
                disabled={!count}
                title={`${compactMoney(heat.priceEdges[r])}–${compactMoney(heat.priceEdges[r + 1])}, ${compactNum(heat.mileEdges[c])}–${compactNum(heat.mileEdges[c + 1])} mi: ${count} listing${count === 1 ? '' : 's'}`}
                onMouseDown={() => { setDrag({ r, c }); setOver({ r, c }) }}
                onMouseEnter={() => drag && setOver({ r, c })}
                onMouseUp={() => { if (drag) commit(drag, { r, c }); setDrag(null); setOver(null) }}
                className={cn('h-6 rounded-[3px] text-[10px] tabular-nums outline-none ring-primary focus-visible:ring-2', count ? 'cursor-pointer text-foreground/80' : 'cursor-default', (inBox(r, c) || picked(r, c)) && 'ring-2')}
                style={{ backgroundColor: count ? `hsl(var(--primary) / ${0.1 + 0.75 * (count / heat.max)})` : 'hsl(var(--muted) / .5)' }}
              >
                {count > 0 && count}
              </button>
            ))}
          </div>
        ))}
        <div />
        {heat.mileEdges.slice(0, cols).map((m, c) => <div key={c} className="pt-0.5 text-center text-[10px] tabular-nums text-muted-foreground">{compactNum(m)}</div>)}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Price by mileage. Click a cell or drag across several to narrow the results.</p>
    </div>
  )
}

export function ListingsExplorer() {
  const [params, setParams] = useQuery()
  const hidden = useHidden()
  const [dealerPref, setDealerPref] = usePref<'dealer' | 'location'>('card-line', 'dealer')
  const [pages, setPages] = useState<ListingView[]>([])
  const [meta, setMeta] = useState<Page | null>(null)
  const [pinState, setPinState] = useState<{ key: string; pins: Pin[] }>({ key: '', pins: [] })
  const [loading, setLoading] = useState(true)
  const sentinel = useRef<HTMLDivElement>(null)
  const loadingMore = useRef(false)

  const layout = params.get('layout') === 'table' ? 'table' : 'grid'
  const showMap = params.get('map') !== 'off'
  const key = params.toString()
  const hiddenKey = hidden.list.join(',')
  const pinParams = new URLSearchParams(filterParams(params)); pinParams.delete('bbox')
  const pinKey = pinParams.toString()

  useEffect(() => {
    const ctl = new AbortController()
    setLoading(true)
    const q = new URLSearchParams(key)
    if (hiddenKey) q.set('hidden', hiddenKey)
    fetch(`/api/listings?${q}&limit=${PAGE}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d: Page) => { setMeta(d); setPages(d.items); setLoading(false) })
      .catch(() => {})
    return () => ctl.abort()
  }, [key, hiddenKey])

  useEffect(() => {
    if (!showMap) return
    const ctl = new AbortController()
    fetch(`/api/map?${pinKey}`, { signal: ctl.signal }).then((r) => r.json()).then((d) => setPinState({ key: pinKey, pins: d.pins })).catch(() => {})
    return () => ctl.abort()
  }, [pinKey, showMap])

  useEffect(() => {
    const el = sentinel.current
    if (!el || !meta) return
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || loadingMore.current || pages.length >= meta.total) return
      loadingMore.current = true
      const q = new URLSearchParams(key)
      if (hiddenKey) q.set('hidden', hiddenKey)
      fetch(`/api/listings?${q}&limit=${PAGE}&offset=${pages.length}`)
        .then((r) => r.json())
        .then((d: Page) => setPages((cur) => [...cur, ...d.items]))
        .finally(() => { loadingMore.current = false })
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [key, hiddenKey, pages.length, meta])

  const setView = (k: string, v: string | null) => { const next = new URLSearchParams(params); if (v) next.set(k, v); else next.delete(k); setParams(next) }
  const sort = params.get('sort') ?? (params.get('zip') ? 'closest' : 'newest')
  const needsZip = sort === 'closest' && !params.get('zip') && !params.get('near')

  return (
    <div className="mx-auto flex max-w-[1500px] gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-bold tracking-tight">
            {meta ? num(meta.total) : '…'} <span className="font-medium text-muted-foreground">{params.get('status') === 'sold' ? 'recently sold · ' : ''}{summarize(params)}</span>
          </h1>
          <Link href={`/search/filters?${filterParams(params)}`} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-secondary">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Link>
          <SaveSearch params={params} total={meta?.total} />
        </div>
        <div className="mt-2"><ActiveChips params={params} onChange={setParams} /></div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-y py-2 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Sort</span>
            <select value={sort} onChange={(e) => setView('sort', e.target.value)} className="h-8 rounded-md border bg-background px-2">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          {needsZip && (
            <form onSubmit={(e) => { e.preventDefault(); const zip = String(new FormData(e.currentTarget).get('near')); if (/^\d{5}$/.test(zip)) setView('near', zip) }} className="flex items-center gap-1">
              <input name="near" placeholder="Your ZIP" inputMode="numeric" maxLength={5} aria-label="Your ZIP code" className="h-8 w-24 rounded-md border bg-background px-2" />
              <button className="h-8 rounded-md bg-secondary px-2 font-medium">Set</button>
            </form>
          )}
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Show</span>
            <select value={dealerPref} onChange={(e) => setDealerPref(e.target.value as 'dealer' | 'location')} className="h-8 rounded-md border bg-background px-2">
              <option value="dealer">Dealer name</option>
              <option value="location">Location only</option>
            </select>
          </label>
          <div className="ml-auto flex items-center gap-1">
            {([['grid', LayoutGrid, 'Grid'], ['table', Table2, 'Table']] as const).map(([v, Icon, label]) => (
              <button key={v} type="button" aria-label={`${label} layout`} aria-pressed={layout === v} onClick={() => setView('layout', v === 'grid' ? null : v)} className={cn('grid h-8 w-8 place-items-center rounded-md border', layout === v && 'bg-secondary')}><Icon className="h-4 w-4" /></button>
            ))}
            <button type="button" aria-pressed={showMap} onClick={() => setView('map', showMap ? 'off' : null)} className={cn('hidden h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium lg:inline-flex', showMap && 'bg-secondary')}>
              <MapIcon className="h-4 w-4" /> {showMap ? 'Hide map' : 'Show map'}
            </button>
          </div>
        </div>

        {meta?.stats.price && (
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <dl className="grid grid-cols-3 gap-2 self-start text-sm">
              {[
                ['Median price', money(meta.stats.price.median), `${compactMoney(meta.stats.price.p25)} – ${compactMoney(meta.stats.price.p75)} typical`],
                ['Median miles', miles(meta.stats.miles?.median), meta.stats.miles ? `${compactNum(meta.stats.miles.p25)} – ${compactNum(meta.stats.miles.p75)} typical` : ''],
                ['Median days listed', String(meta.stats.days?.median ?? '—'), meta.stats.days ? `longest ${meta.stats.days.max}` : ''],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-lg border bg-card p-2.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-base font-semibold tabular-nums">{value}</dd>
                  <dd className="text-[11px] text-muted-foreground">{sub}</dd>
                </div>
              ))}
            </dl>
            {meta.heat && <Heatmap heat={meta.heat} params={params} onChange={setParams} />}
          </div>
        )}

        {loading && !pages.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-64 animate-pulse rounded-lg border bg-muted/40" />)}</div>
        ) : !pages.length ? (
          <div className="mt-10 rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium">No vehicles match these filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">Remove a filter above, widen the map area, or <Link className="text-primary underline" href={`/search/filters?${filterParams(params)}`}>adjust the search</Link>.</p>
            {(params.get('zip') || params.get('bbox')) && (
              <button type="button" onClick={() => { const next = new URLSearchParams(params); ['zip', 'radius', 'bbox'].forEach((k) => next.delete(k)); setParams(next) }} className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                Search nationwide instead
              </button>
            )}
          </div>
        ) : layout === 'grid' ? (
          <div className={cn('mt-4 grid gap-3 sm:grid-cols-2', showMap ? 'xl:grid-cols-3' : 'md:grid-cols-3 xl:grid-cols-4')}>
            {pages.map((l) => <VehicleCard key={l.vin} l={l} showDealer={dealerPref === 'dealer'} />)}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>{['Vehicle', 'Price', 'MSRP', 'Miles', 'Color', 'Listed', dealerPref === 'dealer' ? 'Dealer' : 'Location', ''].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {pages.map((l) => (
                  <tr key={l.vin} className="border-t hover:bg-accent/50">
                    <td className="px-3 py-2"><Link href={`/search/listings/${l.vin}`} className="font-medium hover:underline">{l.year} {l.make} {l.model} {l.version}</Link><div className="mt-0.5"><Tags l={l} /></div></td>
                    <td className="px-3 py-2 font-semibold tabular-nums">{l.price == null ? '—' : money(l.price)}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{money(l.msrp)}</td>
                    <td className="px-3 py-2 tabular-nums">{num(l.miles)}</td>
                    <td className="px-3 py-2">{l.extColor}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{ago(l.daysListed)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{dealerPref === 'dealer' ? l.dealer.name : `${l.dealer.city}, ${l.dealer.state}`}</td>
                    <td className="px-3 py-2"><CardActions vin={l.vin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div ref={sentinel} className="h-10" />
        {meta && pages.length > 0 && pages.length >= meta.total && <p className="pb-6 text-center text-xs text-muted-foreground">That’s all {num(meta.total)}.{hidden.list.length > 0 && ` ${hidden.list.length} hidden listing${hidden.list.length === 1 ? '' : 's'} left out.`}</p>}
      </div>

      {showMap && (
        <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-5.5rem)] w-[38%] max-w-[620px] shrink-0 overflow-hidden rounded-lg border lg:block">
          <ListingsMap
            pins={pinState.pins}
            fitKey={pinState.key}
            bbox={params.get('bbox')}
            onBox={(bbox) => setView('bbox', bbox)}
            onDealer={(name) => setParams(toggleValue(params, 'dealer', name))}
          />
        </aside>
      )}
    </div>
  )
}
