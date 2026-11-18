'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { VehicleCard } from '@/components/vehicle-card'
import { useFavorites, useHidden, useSavedSearches, type SavedSearch } from '@/lib/client-store'
import { describe } from '@/lib/data/filters'
import type { ListingView, RangeStats } from '@/lib/data/types'
import { money, num } from '@/lib/format'
import { cn } from '@/lib/utils'

function useListings(vins: string[]) {
  const [items, setItems] = useState<ListingView[] | null>(null)
  const key = vins.join(',')
  useEffect(() => {
    if (!key) { setItems([]); return }
    const ctl = new AbortController()
    fetch(`/api/listings?vins=${key}`, { signal: ctl.signal }).then((r) => r.json()).then((d) => setItems(d.items)).catch(() => {})
    return () => ctl.abort()
  }, [key])
  return items
}

function SearchRow({ s, onDrop, onOpen }: { s: SavedSearch; onDrop: () => void; onOpen: (total: number) => void }) {
  const [d, setD] = useState<{ total: number; stats: { price: RangeStats | null; days: RangeStats | null } } | null>(null)
  useEffect(() => {
    const ctl = new AbortController()
    fetch(`/api/listings?${s.query}&limit=1`, { signal: ctl.signal }).then((r) => r.json()).then(setD).catch(() => {})
    return () => ctl.abort()
  }, [s.query])
  const fresh = d && s.seenTotal != null ? d.total - s.seenTotal : 0
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/search/listings?${s.query}`} onClick={() => d && onOpen(d.total)} className="font-semibold hover:underline">{s.name}</Link>
          {fresh > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{fresh} more since last viewed</span>}
          <div className="mt-1 flex flex-wrap gap-1">{describe(new URLSearchParams(s.query)).map((c) => <span key={c.key} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{c.label}</span>)}</div>
        </div>
        <button type="button" aria-label={`Delete saved search ${s.name}`} onClick={onDrop} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ['For sale', d ? num(d.total) : '…'],
          ['Median price', d ? money(d.stats.price?.median) : '…'],
          ['Typical range', d?.stats.price ? `${money(d.stats.price.p25)} – ${money(d.stats.price.p75)}` : '—'],
          ['Median days listed', d ? String(d.stats.days?.median ?? '—') : '…'],
        ].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>)}
      </dl>
    </li>
  )
}

export function SavedView() {
  const fav = useFavorites()
  const hidden = useHidden()
  const saved = useSavedSearches()
  const [tab, setTab] = useState<'favorites' | 'searches' | 'hidden'>('favorites')
  const favItems = useListings(fav.list)
  const hiddenItems = useListings(tab === 'hidden' ? hidden.list : [])
  const tabs = [['favorites', 'Favorites', fav.list.length], ['searches', 'Saved searches', saved.list.length], ['hidden', 'Hidden', hidden.list.length]] as const
  const empty = (text: string) => <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</p>

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
      <p className="text-sm text-muted-foreground">Kept in this browser. Email alerts for price drops and new matches arrive with accounts.</p>
      <div role="tablist" className="mt-4 flex gap-1 border-b">
        {tabs.map(([k, label, count]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={cn('-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground', tab === k && 'border-primary text-foreground')}>
            {label} <span className="ml-1 tabular-nums text-muted-foreground">{count}</span>
          </button>
        ))}
      </div>
      <div className="pt-5">
        {tab === 'favorites' && (!fav.list.length ? empty('No favorites yet. Tap the heart on any listing to keep it here and watch its price.') : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(favItems ?? []).map((l) => <VehicleCard key={l.vin} l={l} />)}</div>
        ))}
        {tab === 'searches' && (!saved.list.length ? empty('No saved searches yet. Build a search and choose “Save search” to track its market here.') : (
          <ul className="space-y-3">{saved.list.map((s) => <SearchRow key={s.name} s={s} onDrop={() => saved.drop(s.name)} onOpen={(total) => saved.markSeen(s.name, total)} />)}</ul>
        ))}
        {tab === 'hidden' && (!hidden.list.length ? empty('Nothing hidden. Hide a listing to keep it out of your results.') : (
          <>
            <button type="button" onClick={hidden.clear} className="mb-3 text-sm font-medium text-primary hover:underline">Unhide all</button>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(hiddenItems ?? []).map((l) => <VehicleCard key={l.vin} l={l} />)}</div>
          </>
        ))}
      </div>
    </div>
  )
}
