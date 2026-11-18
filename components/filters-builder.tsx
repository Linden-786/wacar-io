'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Settings2 } from 'lucide-react'
import { ActiveChips, SaveSearch, useQuery } from '@/components/filter-bits'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FACETS, GROUPS, RANGES, getValues, toggleValue, type FacetDef, type Group } from '@/lib/data/filters'
import type { FacetOption, RangeStats } from '@/lib/data/types'
import { money, num } from '@/lib/format'
import { cn } from '@/lib/utils'

interface FacetData { total: number; facets: Record<string, FacetOption[]>; ranges: Record<string, RangeStats | null> }
type Rank = 'count' | 'price' | 'days'

const metric = (o: FacetOption, rank: Rank) => (rank === 'price' ? (o.avgPrice == null ? '—' : money(o.avgPrice)) : rank === 'days' ? `${o.avgDays ?? '—'} d` : num(o.count))

function OptionRow({ def, o, params, rank, exclude, onChange }: { def: FacetDef; o: FacetOption; params: URLSearchParams; rank: Rank; exclude?: boolean; onChange: (p: URLSearchParams) => void }) {
  const on = getValues(params, def.key).includes(o.value)
  const off = getValues(params, `exclude_${def.key}`).includes(o.value)
  const toggle = () => {
    let next = params
    if (off) next = toggleValue(next, `exclude_${def.key}`, o.value)
    else if (exclude) { if (on) next = toggleValue(next, def.key, o.value); next = toggleValue(next, `exclude_${def.key}`, o.value) }
    else next = toggleValue(next, def.key, o.value)
    onChange(next)
  }
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent', on && 'bg-primary/10 font-medium', off && 'bg-destructive/10')}>
      <Checkbox checked={on || off} onCheckedChange={toggle} aria-label={`${off ? 'Excluded: ' : ''}${o.value}`} className={cn(off && 'border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground')} />
      <span className={cn('min-w-0 flex-1 truncate', off && 'line-through decoration-destructive/60')}>{o.value}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{metric(o, rank)}</span>
    </label>
  )
}

function FacetCard({ def, options, params, rank, onChange, needle }: { def: FacetDef; options: FacetOption[]; params: URLSearchParams; rank: Rank; onChange: (p: URLSearchParams) => void; needle: string }) {
  const [more, setMore] = useState(false)
  const [exclude, setExclude] = useState(false)
  const [find, setFind] = useState('')
  const selected = new Set([...getValues(params, def.key), ...getValues(params, `exclude_${def.key}`)])
  const ranked = useMemo(() => {
    const list = [...options]
    if (rank === 'price') list.sort((a, b) => (a.avgPrice ?? Infinity) - (b.avgPrice ?? Infinity))
    if (rank === 'days') list.sort((a, b) => (b.avgDays ?? 0) - (a.avgDays ?? 0))
    return list
  }, [options, rank])
  const matches = needle ? ranked.filter((o) => o.value.toLowerCase().includes(needle)) : ranked
  const top = needle ? matches.slice(0, 12) : [...ranked.filter((o) => selected.has(o.value)), ...ranked.filter((o) => !selected.has(o.value))].slice(0, Math.max(7, selected.size))
  if (!top.length) return null
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 p-3 pb-1.5">
        <CardTitle className="text-sm">{def.label}</CardTitle>
        {def.all && <span className="text-[11px] text-muted-foreground">must have all</span>}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-0.5">{top.map((o) => <OptionRow key={o.value} def={def} o={o} params={params} rank={rank} onChange={onChange} />)}</div>
        {!needle && ranked.length > top.length && (
          <Button type="button" variant="link" size="sm" className="mt-1 h-auto px-2 py-0 text-xs" onClick={() => setMore(true)}>See all {ranked.length}</Button>
        )}
      </CardContent>
      <Dialog open={more} onOpenChange={setMore}>
        <DialogContent className="flex max-h-[80vh] max-w-md flex-col gap-3">
          <DialogHeader>
            <DialogTitle>{def.label}</DialogTitle>
            <DialogDescription>Choose what to include, or switch on exclude mode to rule options out.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <Input autoFocus value={find} onChange={(e) => setFind(e.target.value)} placeholder={`Find in ${def.label.toLowerCase()}…`} className="h-9" />
            <div className="flex shrink-0 items-center gap-2">
              <Switch id={`exclude-${def.key}`} checked={exclude} onCheckedChange={setExclude} className="data-[state=checked]:bg-destructive" />
              <Label htmlFor={`exclude-${def.key}`} className="text-xs">Exclude mode</Label>
            </div>
          </div>
          <div className="-mx-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2">
            {ranked.filter((o) => o.value.toLowerCase().includes(find.toLowerCase())).map((o) => <OptionRow key={o.value} def={def} o={o} params={params} rank={rank} exclude={exclude} onChange={onChange} />)}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function RangeCard({ k, label, unit, stats, params, onChange }: { k: string; label: string; unit: string; stats: RangeStats | null; params: URLSearchParams; onChange: (p: URLSearchParams) => void }) {
  const commit = (side: 'min' | 'max', raw: string) => {
    const next = new URLSearchParams(params)
    const k = /\d\s*k\b/i.test(raw) ? 1000 : 1
    const digits = raw.replace(/[^0-9.-]/g, '')
    const v = digits && Number.isFinite(Number(digits)) ? String(Number(digits) * k) : ''
    if (v) next.set(`${k}_${side}`, v)
    else next.delete(`${k}_${side}`)
    if (next.toString() !== params.toString()) onChange(next)
  }
  const show = (n: number) => (unit === '$' ? money(n) : unit === 'yr' ? String(n) : `${num(n)}${unit === '%' ? '%' : ` ${unit}`}`)
  return (
    <Card>
      <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center gap-2">
          {(['min', 'max'] as const).map((side) => (
            <Input
              key={side + (params.get(`${k}_${side}`) ?? '')}
              inputMode="numeric"
              defaultValue={params.get(`${k}_${side}`) ?? ''}
              placeholder={side === 'min' ? 'Min' : 'Max'}
              aria-label={`${label} ${side}`}
              onBlur={(e) => commit(side, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commit(side, (e.target as HTMLInputElement).value)}
              className="h-9 min-w-0 tabular-nums"
            />
          ))}
        </div>
        {stats && <p className="mt-2 text-xs text-muted-foreground">Available: {show(stats.min)} – {show(stats.max)} · median {show(stats.median)}</p>}
      </CardContent>
    </Card>
  )
}

export function FiltersBuilder() {
  const [params, setParams] = useQuery()
  const [data, setData] = useState<FacetData | null>(null)
  const [tab, setTab] = useState<Group>('basics')
  const [needle, setNeedle] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [rank, setRank] = useState<Rank>('count')
  const [radius, setRadius] = useState(params.get('radius') ?? '100')
  const key = params.toString()

  useEffect(() => {
    const ctl = new AbortController()
    fetch(`/api/facets?${key}`, { signal: ctl.signal }).then((r) => r.json()).then(setData).catch(() => {})
    return () => ctl.abort()
  }, [key])

  const n = needle.trim().toLowerCase()
  const visible = (f: FacetDef) => !f.needs || f.needs.every((k) => getValues(params, k).length > 0)
  const facetList = FACETS.filter((f) => (n ? true : f.group === tab) && visible(f))
  const sold = params.get('status') === 'sold'
  const activeIn = (g: Group) =>
    FACETS.filter((f) => f.group === g).reduce((s, f) => s + getValues(params, f.key).length + getValues(params, `exclude_${f.key}`).length, 0) +
    RANGES.filter((r) => r.group === g && (params.get(`${r.key}_min`) || params.get(`${r.key}_max`))).length +
    (g === 'location' && params.get('zip') ? 1 : 0) + (g === 'history' && params.get('vin') ? 1 : 0)

  const grid = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {!n && RANGES.filter((r) => r.group === tab).map((r) => <RangeCard key={r.key} k={r.key} label={r.label} unit={r.unit} stats={data?.ranges[r.key] ?? null} params={params} onChange={setParams} />)}
      {!n && tab === 'location' && (
        <Card>
          <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Distance from ZIP</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const next = new URLSearchParams(params)
                const zip = String(new FormData(e.currentTarget).get('zip') ?? '').trim()
                if (/^\d{5}$/.test(zip)) { next.set('zip', zip); next.set('radius', radius) } else { next.delete('zip'); next.delete('radius') }
                setParams(next)
              }}
            >
              <Input name="zip" key={params.get('zip') ?? ''} defaultValue={params.get('zip') ?? ''} inputMode="numeric" maxLength={5} placeholder="ZIP" aria-label="ZIP code" className="h-9 w-24" />
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="h-9 w-28" aria-label="Radius"><SelectValue /></SelectTrigger>
                <SelectContent>{[25, 50, 100, 200, 300, 500].map((r) => <SelectItem key={r} value={String(r)}>{r} mi</SelectItem>)}</SelectContent>
              </Select>
              <Button type="submit" variant="secondary" size="sm">Apply</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {!n && tab === 'history' && (
        <Card>
          <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">VIN pattern</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <Input
              key={params.get('vin') ?? ''}
              defaultValue={params.get('vin') ?? ''}
              placeholder="Starts with… use ? for any character"
              aria-label="VIN pattern"
              maxLength={17}
              onBlur={(e) => { const next = new URLSearchParams(params); const v = e.target.value.trim().toUpperCase(); if (v) next.set('vin', v); else next.delete('vin'); if (next.toString() !== key) setParams(next) }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="h-9 font-mono uppercase"
            />
            <p className="mt-2 text-xs text-muted-foreground">Positions 1–3 maker, 4–8 vehicle, 9 check digit, 10 model year, 11 plant, 12–17 serial.</p>
          </CardContent>
        </Card>
      )}
      {data ? facetList.map((f) => <FacetCard key={f.key} def={f} options={data.facets[f.key] ?? []} params={params} rank={rank} onChange={setParams} needle={n} />) : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-48" />)}
    </div>
  )

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Build your search</h1>
          <p className="text-sm text-muted-foreground">Counts update as you choose. Options with nothing for sale drop out.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder='Find a filter, e.g. "brown"' aria-label="Find a filter" className="h-9 w-56 pl-8" />
          </div>
          <Button type="button" variant={advanced ? 'secondary' : 'outline'} size="sm" aria-pressed={advanced} onClick={() => setAdvanced((a) => !a)}>
            <Settings2 className="mr-1.5 h-4 w-4" /> Advanced
          </Button>
        </div>
      </div>

      {advanced && (
        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Switch id="sold-market" checked={sold} onCheckedChange={(v) => { const next = new URLSearchParams(params); if (v) next.set('status', 'sold'); else next.delete('status'); setParams(next) }} />
              <Label htmlFor="sold-market">Show recently sold instead of for sale</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="rank-by">Rank options by</Label>
              <Select value={rank} onValueChange={(v) => setRank(v as Rank)}>
                <SelectTrigger id="rank-by" className="h-9 w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Number for sale</SelectItem>
                  <SelectItem value="price">Average price (low to high)</SelectItem>
                  <SelectItem value="days">Average days for sale (longest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {n ? <div className="mt-5">{grid}</div> : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as Group)} className="mt-5">
          <div className="overflow-x-auto">
            <TabsList className="h-auto justify-start">
              {GROUPS.map((g) => {
                const active = activeIn(g.id)
                return (
                  <TabsTrigger key={g.id} value={g.id}>
                    {g.label}{active > 0 && <Badge className="ml-1.5 px-1.5 py-0 text-[11px]">{active}</Badge>}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          <TabsContent value={tab} className="mt-4">
            {grid}
            {tab === 'vehicle' && !getValues(params, 'make').length && <p className="mt-3 text-sm text-muted-foreground">Pick a make to choose models, then generations, trims and versions.</p>}
          </TabsContent>
        </Tabs>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1"><ActiveChips params={params} onChange={setParams} /></div>
          <SaveSearch params={params} total={data?.total} />
          <Button asChild className="font-semibold">
            <Link href={`/search/listings?${key}`}>Show {data ? num(data.total) : '…'} {sold ? 'sold ' : ''}vehicles</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
