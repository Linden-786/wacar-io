'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Building2, Car, History, Search } from 'lucide-react'
import { useRecentSearches, useSavedSearches } from '@/lib/client-store'
import type { Interpretation } from '@/lib/data/understand'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface Row { label: string; href: string; icon: 'search' | 'listing' | 'dealer' | 'recent' | 'saved'; remember?: boolean }

const ICONS = { search: Search, listing: Car, dealer: Building2, recent: History, saved: Bookmark }

export function SearchBox({ large, autoFocus }: { large?: boolean; autoFocus?: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [found, setFound] = useState<Interpretation[]>([])
  const [pending, setPending] = useState(false)
  const recents = useRecentSearches()
  const saved = useSavedSearches()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!q.trim()) { setFound([]); setPending(false); return }
    setPending(true)
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/understand?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => { setFound(d.interpretations); setActive(0); setPending(false) })
        .catch(() => {})
    }, 120)
    return () => { clearTimeout(t); ctl.abort() }
  }, [q])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const needle = q.trim().toLowerCase()
  const rows: Row[] = needle
    ? [
        ...saved.list.filter((s) => s.name.toLowerCase().includes(needle)).slice(0, 2).map((s) => ({ label: s.name, href: `/search/listings?${s.query}`, icon: 'saved' as const })),
        ...found.map((i) => ({ label: i.label, href: i.kind === 'listing' ? `/search/listings/${i.query}` : `/search/listings?${i.query}`, icon: i.kind, remember: i.kind !== 'listing' })),
      ]
    : [
        ...saved.list.slice(0, 3).map((s) => ({ label: s.name, href: `/search/listings?${s.query}`, icon: 'saved' as const })),
        ...recents.list.map((r) => ({ ...r, icon: 'recent' as const })),
      ]

  const go = (row: Row) => {
    if (row.remember) recents.add({ label: row.label, href: row.href })
    setOpen(false)
    setQ('')
    router.push(row.href)
  }

  return (
    <div ref={box} className="relative w-full">
      <Search className={cn('pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground', large ? 'h-5 w-5' : 'h-4 w-4')} />
      <Input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
          else if (e.key === 'Enter') {
            e.preventDefault()
            if (!pending && rows[active]) go(rows[active])
            else if (needle) {
              fetch(`/api/understand?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d: { interpretations: Interpretation[] }) => {
                const i = d.interpretations[0]
                if (i) go({ label: i.label, href: i.kind === 'listing' ? `/search/listings/${i.query}` : `/search/listings?${i.query}`, icon: i.kind, remember: i.kind !== 'listing' })
              }).catch(() => {})
            }
          }
          else if (e.key === 'Escape') setOpen(false)
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls="search-suggestions"
        aria-label="Search vehicles"
        placeholder={large ? 'Try "awd hybrid suv under 40k near 43215", a VIN, or a dealer' : 'Search model, VIN, dealer…'}
        className={cn(
          'rounded-lg pr-3',
          large ? 'h-14 pl-11 text-base shadow-sm' : 'h-9 pl-9',
        )}
      />
      {open && rows.length > 0 && (
        <ul id="search-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-popover py-1 text-popover-foreground shadow-lg">
          {rows.map((row, i) => {
            const Icon = ICONS[row.icon]
            return (
              <li key={row.href + row.icon} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(row)}
                  className={cn('flex w-full items-center gap-3 px-3 py-2 text-left text-sm', i === active && 'bg-accent')}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{row.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {open && needle && !pending && rows.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover px-3 py-3 text-sm text-muted-foreground shadow-lg">
          Nothing matched. Try a make and model, a price like “under 30k”, or a ZIP code.
        </div>
      )}
    </div>
  )
}
