'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VehicleCard } from '@/components/vehicle-card'
import { useFavorites, useHidden, useSavedSearches, type SavedSearch } from '@/lib/client-store'
import { describe } from '@/lib/data/filters'
import type { ListingView, RangeStats } from '@/lib/data/types'
import { money, num } from '@/lib/format'

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

function SearchRow({ s, hidden, onDrop, onOpen }: { s: SavedSearch; hidden: string; onDrop: () => void; onOpen: (total: number) => void }) {
  const [d, setD] = useState<{ total: number; stats: { price: RangeStats | null; days: RangeStats | null } } | null>(null)
  useEffect(() => {
    const ctl = new AbortController()
    fetch(`/api/listings?${s.query}&limit=1${hidden ? `&hidden=${hidden}` : ''}`, { signal: ctl.signal }).then((r) => r.json()).then(setD).catch(() => {})
    return () => ctl.abort()
  }, [s.query, hidden])
  const fresh = d && s.seenTotal != null ? d.total - s.seenTotal : 0
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/search/listings?${s.query}`} onClick={() => d && onOpen(d.total)} className="font-semibold hover:underline">{s.name}</Link>
            {fresh > 0 && <Badge className="ml-2">{fresh} more since last viewed</Badge>}
            <div className="mt-1.5 flex flex-wrap gap-1">{describe(new URLSearchParams(s.query)).map((c) => <Badge key={c.key} variant="secondary" className="rounded px-1.5 py-0 text-[11px] font-medium">{c.label}</Badge>)}</div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Delete saved search ${s.name}`} onClick={onDrop}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {[
            ['For sale', d ? num(d.total) : '…'],
            ['Median price', d ? money(d.stats.price?.median) : '…'],
            ['Typical range', d?.stats.price ? `${money(d.stats.price.p25)} – ${money(d.stats.price.p75)}` : '—'],
            ['Median days listed', d ? String(d.stats.days?.median ?? '—') : '…'],
          ].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>)}
        </dl>
      </CardContent>
    </Card>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <Card className="border-dashed shadow-none"><CardContent className="p-10 text-center text-sm text-muted-foreground">{children}</CardContent></Card>
)

function Grid({ items, count }: { items: ListingView[] | null; count: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items ? items.map((l) => <VehicleCard key={l.vin} l={l} />) : Array.from({ length: Math.min(count, 8) }, (_, i) => <Skeleton key={i} className="h-64" />)}
    </div>
  )
}

export function SavedView() {
  const fav = useFavorites()
  const hidden = useHidden()
  const saved = useSavedSearches()
  const [tab, setTab] = useState('favorites')
  const favItems = useListings(fav.list)
  const hiddenItems = useListings(tab === 'hidden' ? hidden.list : [])
  const count = (n: number) => <span className="ml-1.5 tabular-nums text-muted-foreground">{n}</span>

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
      <p className="text-sm text-muted-foreground">Kept in this browser. Email alerts for price drops and new matches arrive with accounts.</p>
      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="favorites">Favorites{count(fav.list.length)}</TabsTrigger>
          <TabsTrigger value="searches">Saved searches{count(saved.list.length)}</TabsTrigger>
          <TabsTrigger value="hidden">Hidden{count(hidden.list.length)}</TabsTrigger>
        </TabsList>
        <TabsContent value="favorites" className="pt-4">
          {!fav.list.length ? <Empty>No favorites yet. Tap the heart on any listing to keep it here and watch its price.</Empty> : <Grid items={favItems} count={fav.list.length} />}
        </TabsContent>
        <TabsContent value="searches" className="pt-4">
          {!saved.list.length ? <Empty>No saved searches yet. Build a search and choose “Save search” to track its market here.</Empty> : (
            <ul className="space-y-3">{saved.list.map((s) => <li key={s.name}><SearchRow s={s} hidden={hidden.list.slice(0, 200).join(',')} onDrop={() => saved.drop(s.name)} onOpen={(total) => saved.markSeen(s.name, total)} /></li>)}</ul>
          )}
        </TabsContent>
        <TabsContent value="hidden" className="pt-4">
          {!hidden.list.length ? <Empty>Nothing hidden. Hide a listing to keep it out of your results.</Empty> : (
            <>
              <Button type="button" variant="link" size="sm" className="mb-2 h-auto p-0" onClick={hidden.clear}>Unhide all</Button>
              <Grid items={hiddenItems} count={hidden.list.length} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
