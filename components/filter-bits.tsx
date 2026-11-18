'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Bookmark, BookmarkCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSavedSearches } from '@/lib/client-store'
import { describe, filterParams, summarize } from '@/lib/data/filters'

/** Read the query string and get a setter that keeps it the source of truth. */
export function useQuery() {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const set = (next: URLSearchParams) => router.replace(`${path}?${next.toString()}`, { scroll: false })
  return [new URLSearchParams(params.toString()), set] as const
}

export function ActiveChips({ params, onChange }: { params: URLSearchParams; onChange: (p: URLSearchParams) => void }) {
  const chips = describe(params)
  if (!chips.length) return <span className="text-sm text-muted-foreground">No filters yet: showing everything for sale.</span>
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <Badge key={c.key} variant="secondary" className="gap-1 py-1 pr-1 font-medium">
          {c.label}
          <button type="button" aria-label={`Remove filter ${c.label}`} onClick={() => onChange(c.remove(params))} className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto px-1.5 py-0 text-xs text-muted-foreground"
        onClick={() => { const keep = new URLSearchParams(); ['sort', 'layout', 'map'].forEach((k) => params.get(k) && keep.set(k, params.get(k)!)); onChange(keep) }}
      >
        Clear all
      </Button>
    </div>
  )
}

export function SaveSearch({ params, total }: { params: URLSearchParams; total?: number }) {
  const saved = useSavedSearches()
  const query = filterParams(params).toString()
  const existing = saved.list.find((s) => s.query === query)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  if (existing) {
    return (
      <Button type="button" variant="outline" size="sm" className="text-primary" onClick={() => saved.drop(existing.name)}>
        <BookmarkCheck className="mr-1.5 h-4 w-4" /> Saved
      </Button>
    )
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setName(summarize(params)); setOpen(o) }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Bookmark className="mr-1.5 h-4 w-4" /> Save search</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; saved.save({ name: name.trim(), query, savedAt: Date.now(), seenTotal: total }); setOpen(false) }} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
            <DialogDescription>Find it under Saved, with a market summary and a count of new matches.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="search-name">Name</Label>
            <Input id="search-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter><Button type="submit">Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
