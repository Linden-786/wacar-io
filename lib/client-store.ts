'use client'
// Favorites, hidden listings, saved searches and recent searches live in the
// browser for now. They move to an account once sign-in exists.
import { useCallback, useSyncExternalStore } from 'react'

export interface SavedSearch { name: string; query: string; savedAt: number; seenTotal?: number }

const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  let raw: string | null = null
  try { raw = window.localStorage.getItem(key) } catch { return fallback }
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value = fallback
  try { if (raw) value = JSON.parse(raw) as T } catch { /* corrupted entry: fall back */ }
  cache.set(key, { raw, value })
  return value
}

function write<T>(key: string, value: T) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  window.addEventListener('storage', l)
  return () => { listeners.delete(l); window.removeEventListener('storage', l) }
}

function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback)
  const set = useCallback((next: T | ((cur: T) => T)) => write(key, typeof next === 'function' ? (next as (c: T) => T)(read(key, fallback)) : next), [key, fallback])
  return [value, set] as const
}

const EMPTY: never[] = []

function useVinList(key: string) {
  const [list, set] = useStored<string[]>(key, EMPTY)
  const toggle = useCallback((vin: string) => set((cur) => (cur.includes(vin) ? cur.filter((v) => v !== vin) : [vin, ...cur])), [set])
  return { list, has: (vin: string) => list.includes(vin), toggle, clear: () => set([]) }
}

export const useFavorites = () => useVinList('wacar:favorites')
export const useHidden = () => useVinList('wacar:hidden')

export function useSavedSearches() {
  const [list, set] = useStored<SavedSearch[]>('wacar:saved-searches', EMPTY)
  return {
    list,
    save: (s: SavedSearch) => set((cur) => [s, ...cur.filter((x) => x.name !== s.name)]),
    drop: (name: string) => set((cur) => cur.filter((x) => x.name !== name)),
    markSeen: (name: string, total: number) => set((cur) => cur.map((x) => (x.name === name ? { ...x, seenTotal: total } : x))),
  }
}

export function useRecentSearches() {
  const [list, set] = useStored<{ label: string; href: string }[]>('wacar:recent', EMPTY)
  return { list, add: (r: { label: string; href: string }) => set((cur) => [r, ...cur.filter((x) => x.href !== r.href)].slice(0, 6)) }
}

export function usePref<T extends string>(key: string, fallback: T) {
  return useStored<T>(`wacar:pref:${key}`, fallback)
}
