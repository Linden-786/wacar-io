'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Bookmark, BookmarkCheck, X } from 'lucide-react'
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
        <button key={c.key} type="button" onClick={() => onChange(c.remove(params))} className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/70">
          {c.label}
          <X className="h-3 w-3 text-muted-foreground" aria-label="Remove filter" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => { const keep = new URLSearchParams(); ['sort', 'layout', 'map'].forEach((k) => params.get(k) && keep.set(k, params.get(k)!)); onChange(keep) }}
        className="px-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Clear all
      </button>
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
      <button type="button" onClick={() => saved.drop(existing.name)} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium text-primary">
        <BookmarkCheck className="h-4 w-4" /> Saved
      </button>
    )
  }
  return (
    <div className="relative">
      <button type="button" onClick={() => { setName(summarize(params)); setOpen((o) => !o) }} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-secondary">
        <Bookmark className="h-4 w-4" /> Save search
      </button>
      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; saved.save({ name: name.trim(), query, savedAt: Date.now(), seenTotal: total }); setOpen(false) }}
          className="absolute right-0 top-full z-30 mt-1 flex w-72 gap-2 rounded-lg border bg-popover p-2 shadow-lg"
        >
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Search name" className="h-8 min-w-0 flex-1 rounded border bg-background px-2 text-sm" />
          <button type="submit" className="h-8 rounded bg-primary px-3 text-sm font-medium text-primary-foreground">Save</button>
        </form>
      )}
    </div>
  )
}
