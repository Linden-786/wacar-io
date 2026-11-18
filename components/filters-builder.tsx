'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Ban, Check, Search, Settings2, X } from 'lucide-react'
import { ActiveChips, SaveSearch, useQuery } from '@/components/filter-bits'
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
  return (
    <button
      type="button"
      aria-pressed={on || off}
      onClick={() => {
        let next = params
        if (exclude) { if (on) next = toggleValue(next, def.key, o.value); next = toggleValue(next, `exclude_${def.key}`, o.value) }
        else { if (off) next = toggleValue(next, `exclude_${def.key}`, o.value); next = toggleValue(next, def.key, o.value) }
        onChange(next)
      }}
      className={cn('flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent', on && 'bg-primary/10 font-medium', off && 'bg-destructive/10 line-through decoration-destructive/60')}
    >
      <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border', on && 'border-primary bg-primary text-primary-foreground', off && 'border-destructive text-destructive')}>
        {on && <Check className="h-3 w-3" />}
        {off && <Ban className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{o.value}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{metric(o, rank)}</span>
    </button>
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
    <section className="rounded-lg border bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{def.label}</h3>
        {def.all && <span className="text-[11px] text-muted-foreground">must have all</span>}
      </div>
      <div className="space-y-0.5">{top.map((o) => <OptionRow key={o.value} def={def} o={o} params={params} rank={rank} onChange={onChange} />)}</div>
      {!needle && ranked.length > top.length && (
        <button type="button" onClick={() => setMore(true)} className="mt-1.5 px-2 text-xs font-medium text-primary hover:underline">See all {ranked.length}</button>
      )}
      {more && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setMore(false)}>
          <div role="dialog" aria-label={def.label} className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg border bg-popover shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b p-3">
              <h3 className="flex-1 font-semibold">{def.label}</h3>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} className="accent-[hsl(var(--destructive))]" /> Exclude mode
              </label>
              <button type="button" aria-label="Close" onClick={() => setMore(false)} className="grid h-7 w-7 place-items-center rounded hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <input autoFocus value={find} onChange={(e) => setFind(e.target.value)} placeholder={`Find in ${def.label.toLowerCase()}…`} className="m-3 mb-1 h-9 rounded border bg-background px-3 text-sm" />
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3 pt-1">
              {ranked.filter((o) => o.value.toLowerCase().includes(find.toLowerCase())).map((o) => <OptionRow key={o.value} def={def} o={o} params={params} rank={rank} exclude={exclude} onChange={onChange} />)}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function RangeCard({ k, label, unit, stats, params, onChange }: { k: string; label: string; unit: string; stats: RangeStats | null; params: URLSearchParams; onChange: (p: URLSearchParams) => void }) {
  const commit = (side: 'min' | 'max', raw: string) => {
    const next = new URLSearchParams(params)
    const v = raw.replace(/[^0-9.-]/g, '')
    if (v) next.set(`${k}_${side}`, v)
    else next.delete(`${k}_${side}`)
    if (next.toString() !== params.toString()) onChange(next)
  }
  const show = (n: number) => (unit === '$' ? money(n) : unit === 'yr' ? String(n) : `${num(n)}${unit === '%' ? '%' : ` ${unit}`}`)
  return (
    <section className="rounded-lg border bg-card p-3">
      <h3 className="mb-2 text-sm font-semibold">{label}</h3>
      <div className="flex items-center gap-2">
        {(['min', 'max'] as const).map((side) => (
          <input
            key={side + (params.get(`${k}_${side}`) ?? '')}
            inputMode="numeric"
            defaultValue={params.get(`${k}_${side}`) ?? ''}
            placeholder={side === 'min' ? 'Min' : 'Max'}
            aria-label={`${label} ${side}`}
            onBlur={(e) => commit(side, e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit(side, (e.target as HTMLInputElement).value)}
            className="h-9 w-full min-w-0 rounded border bg-background px-2 text-sm tabular-nums"
          />
        ))}
      </div>
      {stats && <p className="mt-2 text-xs text-muted-foreground">Available: {show(stats.min)} – {show(stats.max)} · median {show(stats.median)}</p>}
    </section>
  )
}

export function FiltersBuilder() {
  const [params, setParams] = useQuery()
  const [data, setData] = useState<FacetData | null>(null)
  const [tab, setTab] = useState<Group>('basics')
  const [needle, setNeedle] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [rank, setRank] = useState<Rank>('count')
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
            <input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder='Find a filter, e.g. "brown"' aria-label="Find a filter" className="h-9 w-56 rounded-md border bg-background pl-8 pr-2 text-sm" />
          </div>
          <button type="button" aria-pressed={advanced} onClick={() => setAdvanced((a) => !a)} className={cn('inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-secondary', advanced && 'bg-secondary')}>
            <Settings2 className="h-4 w-4" /> Advanced
          </button>
        </div>
      </div>

      {advanced && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Market</span>
            {[['active', 'For sale now'], ['sold', 'Recently sold']].map(([v, label]) => (
              <button key={v} type="button" aria-pressed={sold === (v === 'sold')} onClick={() => { const next = new URLSearchParams(params); if (v === 'sold') next.set('status', 'sold'); else next.delete('status'); setParams(next) }} className={cn('rounded-md border px-2.5 py-1', sold === (v === 'sold') && 'border-primary bg-primary/10 font-medium')}>{label}</button>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <span className="font-medium">Rank options by</span>
            <select value={rank} onChange={(e) => setRank(e.target.value as Rank)} className="h-8 rounded-md border bg-background px-2">
              <option value="count">Number for sale</option>
              <option value="price">Average price (low to high)</option>
              <option value="days">Average days for sale (longest first)</option>
            </select>
          </label>
        </div>
      )}

      {!n && (
        <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto border-b">
          {GROUPS.map((g) => {
            const active = FACETS.filter((f) => f.group === g.id).reduce((s, f) => s + getValues(params, f.key).length + getValues(params, `exclude_${f.key}`).length, 0) + RANGES.filter((r) => r.group === g.id && (params.get(`${r.key}_min`) || params.get(`${r.key}_max`))).length + (g.id === 'location' && params.get('zip') ? 1 : 0)
            return (
              <button key={g.id} role="tab" aria-selected={tab === g.id} type="button" onClick={() => setTab(g.id)} className={cn('-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground', tab === g.id && 'border-primary text-foreground')}>
                {g.label}{active > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{active}</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!n && RANGES.filter((r) => r.group === tab).map((r) => <RangeCard key={r.key} k={r.key} label={r.label} unit={r.unit} stats={data?.ranges[r.key] ?? null} params={params} onChange={setParams} />)}
        {!n && tab === 'location' && (
          <section className="rounded-lg border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">Distance from ZIP</h3>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget), next = new URLSearchParams(params)
                const zip = String(f.get('zip') ?? '').trim()
                if (/^\d{5}$/.test(zip)) { next.set('zip', zip); next.set('radius', String(f.get('radius'))) } else { next.delete('zip'); next.delete('radius') }
                setParams(next)
              }}
            >
              <input name="zip" key={params.get('zip') ?? ''} defaultValue={params.get('zip') ?? ''} inputMode="numeric" maxLength={5} placeholder="ZIP" aria-label="ZIP code" className="h-9 w-24 rounded border bg-background px-2 text-sm" />
              <select name="radius" defaultValue={params.get('radius') ?? '100'} aria-label="Radius" className="h-9 rounded border bg-background px-2 text-sm">
                {[25, 50, 100, 200, 300, 500].map((r) => <option key={r} value={r}>{r} mi</option>)}
              </select>
              <button type="submit" className="h-9 rounded bg-secondary px-3 text-sm font-medium">Apply</button>
            </form>
          </section>
        )}
        {!n && tab === 'history' && (
          <section className="rounded-lg border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">VIN pattern</h3>
            <input
              key={params.get('vin') ?? ''}
              defaultValue={params.get('vin') ?? ''}
              placeholder="Starts with… use ? for any character"
              aria-label="VIN pattern"
              maxLength={17}
              onBlur={(e) => { const next = new URLSearchParams(params); const v = e.target.value.trim().toUpperCase(); if (v) next.set('vin', v); else next.delete('vin'); if (next.toString() !== key) setParams(next) }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="h-9 w-full rounded border bg-background px-2 font-mono text-sm uppercase"
            />
            <p className="mt-2 text-xs text-muted-foreground">Positions 1–3 maker, 4–8 vehicle, 9 check digit, 10 model year, 11 plant, 12–17 serial.</p>
          </section>
        )}
        {data ? facetList.map((f) => <FacetCard key={f.key} def={f} options={data.facets[f.key] ?? []} params={params} rank={rank} onChange={setParams} needle={n} />) : Array.from({ length: 6 }, (_, i) => <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted/40" />)}
      </div>
      {!n && tab === 'vehicle' && !getValues(params, 'make').length && <p className="mt-3 text-sm text-muted-foreground">Pick a make to choose models, then generations, trims and versions.</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1"><ActiveChips params={params} onChange={setParams} /></div>
          <SaveSearch params={params} total={data?.total} />
          <Link href={`/search/listings?${key}`} className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Show {data ? num(data.total) : '…'} {sold ? 'sold ' : ''}vehicles
          </Link>
        </div>
      </div>
    </div>
  )
}
