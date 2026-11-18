'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, Table2 } from 'lucide-react'
import { ActiveChips, SaveSearch, useQuery } from '@/components/filter-bits'
import type { Pin } from '@/components/listings-map'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CardActions, Tags, VehicleCard } from '@/components/vehicle-card'
import { useHidden, usePref } from '@/lib/client-store'
import { SORTS, filterParams, summarize, toggleValue } from '@/lib/data/filters'
import type { ListingView, RangeStats } from '@/lib/data/types'
import { ago, compactMoney, compactNum, miles, money, num } from '@/lib/format'
import { cn } from '@/lib/utils'

const ListingsMap = dynamic(() => import('@/components/listings-map'), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> })

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
    return any && (r === 0 ? pMin <= heat.priceEdges[0] : heat.priceEdges[r] >= pMin) && (r === rowsN - 1 ? pMax >= heat.priceEdges[rowsN] : heat.priceEdges[r + 1] <= pMax)
      && (c === 0 ? mMin <= heat.mileEdges[0] : heat.mileEdges[c] >= mMin) && (c === cols - 1 ? mMax >= heat.mileEdges[cols] : heat.mileEdges[c + 1] <= mMax)
  }
  const commit = (a: { r: number; c: number }, b: { r: number; c: number }) => {
    const next = new URLSearchParams(params)
    const put = (k: string, open: boolean, v: number) => { if (open) next.delete(k); else next.set(k, String(v)) }
    put('price_min', Math.min(a.r, b.r) === 0, heat.priceEdges[Math.min(a.r, b.r)])
    put('price_max', Math.max(a.r, b.r) === rowsN - 1, heat.priceEdges[Math.max(a.r, b.r) + 1])
    put('miles_min', Math.min(a.c, b.c) === 0, heat.mileEdges[Math.min(a.c, b.c)])
    put('miles_max', Math.max(a.c, b.c) === cols - 1, heat.mileEdges[Math.max(a.c, b.c) + 1])
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
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit({ r, c }, { r, c }) } }}
                className={cn('h-6 rounded-[3px] text-[10px] tabular-nums outline-none ring-ring focus-visible:ring-2', count ? 'cursor-pointer text-foreground/80' : 'cursor-default', (inBox(r, c) || picked(r, c)) && 'ring-2')}
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
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [wide, setWide] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const loadingMore = useRef(false)
  // The hidden list is sent to the server once per search so page offsets stay
  // consistent; listings hidden afterwards are dropped from the list locally.
  const hiddenRef = useRef(hidden.list)
  hiddenRef.current = hidden.list
  const sentHidden = useRef('')

  const layout = params.get('layout') === 'table' ? 'table' : 'grid'
  const showMap = params.get('map') !== 'off'
  const key = params.toString()
  const pinParams = new URLSearchParams(filterParams(params)); pinParams.delete('bbox')
  const pinKey = pinParams.toString()

  useEffect(() => {
    const ctl = new AbortController()
    setLoading(true)
    sentHidden.current = hiddenRef.current.slice(0, 200).join(',')
    const q = new URLSearchParams(key)
    if (sentHidden.current) q.set('hidden', sentHidden.current)
    fetch(`/api/listings?${q}&limit=${PAGE}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d: Page) => { setMeta(d); setPages(d.items); setLoadedKey(key); setLoading(false) })
      .catch((e) => { if (e?.name !== 'AbortError') setLoading(false) })
    return () => ctl.abort()
  }, [key])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!showMap || !wide) return
    const ctl = new AbortController()
    fetch(`/api/map?${pinKey}`, { signal: ctl.signal }).then((r) => r.json()).then((d) => setPinState({ key: pinKey, pins: d.pins })).catch(() => {})
    return () => ctl.abort()
  }, [pinKey, showMap, wide])

  useEffect(() => {
    const el = sentinel.current
    // only page further once the first page for the current filters has arrived
    if (!el || !meta || loadedKey !== key) return
    const ctl = new AbortController()
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || loadingMore.current || pages.length >= meta.total) return
      loadingMore.current = true
      const q = new URLSearchParams(key)
      if (sentHidden.current) q.set('hidden', sentHidden.current)
      fetch(`/api/listings?${q}&limit=${PAGE}&offset=${pages.length}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: Page) => setPages((cur) => [...cur, ...d.items.filter((x) => !cur.some((y) => y.vin === x.vin))]))
        .catch(() => {})
        .finally(() => { loadingMore.current = false })
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => { io.disconnect(); ctl.abort(); loadingMore.current = false }
  }, [key, loadedKey, pages.length, meta])

  const setView = (k: string, v: string | null) => { const next = new URLSearchParams(params); if (v) next.set(k, v); else next.delete(k); setParams(next) }
  const sort = params.get('sort') ?? (params.get('zip') ? 'closest' : 'newest')
  const needsZip = sort === 'closest' && !params.get('zip') && !params.get('near')
  const shown = pages.filter((l) => !hidden.has(l.vin))
  const total = meta ? meta.total - (pages.length - shown.length) : null

  return (
    <div className="mx-auto flex max-w-[1500px] gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-bold tracking-tight">
            {total != null ? num(total) : '…'} <span className="font-medium text-muted-foreground">{params.get('status') === 'sold' ? 'recently sold · ' : ''}{summarize(params)}</span>
          </h1>
          <Button asChild variant="outline" size="sm">
            <Link href={`/search/filters?${filterParams(params)}`}><SlidersHorizontal className="mr-1.5 h-4 w-4" /> Filters</Link>
          </Button>
          <SaveSearch params={params} total={total ?? undefined} />
        </div>
        <div className="mt-2"><ActiveChips params={params} onChange={setParams} /></div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y py-2 text-sm">
          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="text-muted-foreground">Sort</Label>
            <Select value={sort} onValueChange={(v) => setView('sort', v)}>
              <SelectTrigger id="sort" className="h-9 w-56"><SelectValue /></SelectTrigger>
              <SelectContent>{SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {needsZip && (
            <form onSubmit={(e) => { e.preventDefault(); const zip = String(new FormData(e.currentTarget).get('near')); if (/^\d{5}$/.test(zip)) setView('near', zip) }} className="flex items-center gap-1.5">
              <Input name="near" placeholder="Your ZIP" inputMode="numeric" maxLength={5} aria-label="Your ZIP code" className="h-9 w-24" />
              <Button type="submit" variant="secondary" size="sm">Set</Button>
            </form>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="card-line" className="text-muted-foreground">Show</Label>
            <Select value={dealerPref} onValueChange={(v) => setDealerPref(v as 'dealer' | 'location')}>
              <SelectTrigger id="card-line" className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dealer">Dealer name</SelectItem>
                <SelectItem value="location">Location only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {([['grid', LayoutGrid, 'Grid'], ['table', Table2, 'Table']] as const).map(([v, Icon, label]) => (
              <Button key={v} type="button" size="icon" variant={layout === v ? 'secondary' : 'outline'} className="h-9 w-9" aria-label={`${label} layout`} aria-pressed={layout === v} onClick={() => setView('layout', v === 'grid' ? null : v)}><Icon className="h-4 w-4" /></Button>
            ))}
            <Button type="button" size="sm" variant={showMap ? 'secondary' : 'outline'} className="hidden lg:inline-flex" aria-pressed={showMap} onClick={() => setView('map', showMap ? 'off' : null)}>
              <MapIcon className="mr-1.5 h-4 w-4" /> {showMap ? 'Hide map' : 'Show map'}
            </Button>
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
                <Card key={label} className="shadow-none">
                  <CardContent className="p-2.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-base font-semibold tabular-nums">{value}</dd>
                    <dd className="text-[11px] text-muted-foreground">{sub}</dd>
                  </CardContent>
                </Card>
              ))}
            </dl>
            {meta.heat && <Heatmap heat={meta.heat} params={params} onChange={setParams} />}
          </div>
        )}

        {loading && !shown.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div>
        ) : !shown.length ? (
          <Card className="mt-10 border-dashed shadow-none">
            <CardContent className="p-10 text-center">
              <p className="font-medium">No vehicles match these filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">Remove a filter above, widen the map area, or <Link className="text-primary underline" href={`/search/filters?${filterParams(params)}`}>adjust the search</Link>.</p>
              {(params.get('zip') || params.get('bbox')) && (
                <Button type="button" className="mt-4" onClick={() => { const next = new URLSearchParams(params); ['zip', 'radius', 'bbox'].forEach((k) => next.delete(k)); setParams(next) }}>
                  Search nationwide instead
                </Button>
              )}
            </CardContent>
          </Card>
        ) : layout === 'grid' ? (
          <div className={cn('mt-4 grid gap-3 sm:grid-cols-2', showMap ? 'xl:grid-cols-3' : 'md:grid-cols-3 xl:grid-cols-4')}>
            {shown.map((l) => <VehicleCard key={l.vin} l={l} showDealer={dealerPref === 'dealer'} />)}
          </div>
        ) : (
          <Card className="mt-4 overflow-hidden shadow-none">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>{['Vehicle', 'Price', 'MSRP', 'Miles', 'Color', 'Listed', dealerPref === 'dealer' ? 'Dealer' : 'Location', ''].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((l) => (
                  <TableRow key={l.vin}>
                    <TableCell><Link href={`/search/listings/${l.vin}`} className="font-medium hover:underline">{l.year} {l.make} {l.model} {l.version}</Link><div className="mt-0.5"><Tags l={l} /></div></TableCell>
                    <TableCell className="font-semibold tabular-nums">{l.price == null ? '—' : money(l.price)}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{money(l.msrp)}</TableCell>
                    <TableCell className="tabular-nums">{num(l.miles)}</TableCell>
                    <TableCell>{l.extColor}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{ago(l.daysListed)}</TableCell>
                    <TableCell className="text-muted-foreground">{dealerPref === 'dealer' ? l.dealer.name : `${l.dealer.city}, ${l.dealer.state}`}</TableCell>
                    <TableCell><CardActions vin={l.vin} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <div ref={sentinel} className="h-10" />
        {meta && shown.length > 0 && pages.length >= meta.total && <p className="pb-6 text-center text-xs text-muted-foreground">That’s all {num(total)}.{hidden.list.length > 0 && ` ${hidden.list.length} hidden listing${hidden.list.length === 1 ? '' : 's'} left out.`}</p>}
      </div>

      {showMap && wide && (
        <aside className="sticky top-[4.5rem] h-[calc(100vh-5.5rem)] w-[38%] max-w-[620px] shrink-0 overflow-hidden rounded-lg border">
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
