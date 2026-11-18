// Server-side search engine over the listings store: filtering, sorting,
// facet counts and market statistics. A licensed feed would replace the store,
// not this interface.
import zipcodes from 'zipcodes'
import { FACETS, FACET_BY_KEY, RANGES, getValues } from './filters'
import { MODELS, slug } from './catalog'
import { buildRealStore } from './real'
import { buildStore, KNOWN_ZIPS, SEED_VERSION, type Store } from './seed'
import type { Dealer, FacetOption, Listing, ListingView, RangeStats } from './types'

// Real crawled inventory when a snapshot is present; otherwise the generated
// sample market. Cached across requests and rebuilt once a day, because the
// "days ago" figures are relative to today.
const g = globalThis as unknown as { __wacarStore?: { version: string; store: Store } }
export function getStore(): Store {
  const version = `${SEED_VERSION}:${new Date().toISOString().slice(0, 10)}`
  if (g.__wacarStore?.version !== version) g.__wacarStore = { version, store: buildRealStore() ?? buildStore() }
  return g.__wacarStore.store
}

/** What can be searched for: every make and model in the current store, with its trims. */
export interface VocabModel { make: string; model: string; body: string; seats: number; plant: string; country: string; trims: { name: string }[]; gens: { name: string; from: number; to: number }[] }
const vocabCache = new WeakMap<Store, VocabModel[]>()
export function vocabulary(): VocabModel[] {
  const store = getStore()
  let v = vocabCache.get(store)
  if (!v) {
    if (store.source === 'sample') v = MODELS
    else {
      const by = new Map<string, { l: Listing; trims: Set<string> }>()
      for (const l of store.listings) {
        const k = `${l.make}|${l.model}`
        if (!by.has(k)) by.set(k, { l, trims: new Set() })
        by.get(k)!.trims.add(l.trim)
      }
      v = Array.from(by.values(), ({ l, trims }) => ({
        make: l.make, model: l.model, body: l.body, seats: l.seats, plant: l.plant, country: l.country,
        trims: Array.from(trims, (name) => ({ name })),
        gens: MODELS.find((m) => m.make === l.make && m.model === l.model)?.gens ?? [],
      }))
    }
    vocabCache.set(store, v)
  }
  return v
}
export const storeMakes = () => Array.from(new Set(vocabulary().map((m) => m.make))).sort()
export const findStoreModel = (makeSlug: string, modelSlug: string) => vocabulary().find((m) => slug(m.make) === slug(makeSlug) && slug(m.model) === slug(modelSlug))

export interface Point { lat: number; lng: number; label: string }

export function locateZip(zip: string | null | undefined): Point | null {
  if (!zip || !/^\d{5}$/.test(zip)) return null
  const hit = zipcodes.lookup(zip)
  if (hit) return { lat: hit.latitude, lng: hit.longitude, label: `${hit.city}, ${hit.state}` }
  const known = KNOWN_ZIPS.find((z) => z.zip === zip)
  return known ? { lat: known.lat, lng: known.lng, label: `${known.city}, ${known.state}` } : null
}

export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLng = (bLng - aLng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

export const discountOf = (l: Listing) => (l.price == null ? null : Math.round(((l.msrp - l.price) / l.msrp) * 1000) / 10)

const rangeValue = (key: string, l: Listing): number | null => {
  switch (key) {
    case 'price': return l.price
    case 'miles': return l.miles
    case 'msrp': return l.msrp
    case 'year': return l.year
    case 'days': return l.daysListed - (l.soldDay ?? 0)
    case 'discount': return discountOf(l)
    default: return null
  }
}

type Pred = (l: Listing, d: Dealer) => boolean

/** Build one predicate per filter so facets can skip their own filter. */
function predicates(p: URLSearchParams): { key: string; test: Pred }[] {
  const out: { key: string; test: Pred }[] = []
  const status = p.get('status') === 'sold' ? 'sold' : 'active'
  out.push({ key: 'status', test: (l) => l.status === status })

  for (const f of FACETS) {
    const inc = getValues(p, f.key)
    const exc = getValues(p, `exclude_${f.key}`)
    if (!inc.length && !exc.length) continue
    const incSet = new Set(inc), excSet = new Set(exc)
    out.push({
      key: f.key,
      test: (l, d) => {
        const v = f.get(l, d)
        const arr = Array.isArray(v) ? v : [v]
        if (excSet.size && arr.some((x) => excSet.has(x))) return false
        if (!incSet.size) return true
        return f.all ? inc.every((x) => arr.includes(x)) : arr.some((x) => incSet.has(x))
      },
    })
  }
  for (const r of RANGES) {
    const min = p.get(`${r.key}_min`), max = p.get(`${r.key}_max`)
    if (min == null && max == null) continue
    // a bound that is not a number is ignored rather than matching nothing
    const lo = min == null || min === '' || !Number.isFinite(Number(min)) ? -Infinity : Number(min)
    const hi = max == null || max === '' || !Number.isFinite(Number(max)) ? Infinity : Number(max)
    if (lo === -Infinity && hi === Infinity) continue
    out.push({ key: `${r.key}_range`, test: (l) => { const v = rangeValue(r.key, l); return v != null && v >= lo && v <= hi } })
  }
  const origin = locateZip(p.get('zip'))
  if (origin) {
    const radius = Math.max(1, Math.min(500, Number(p.get('radius')) || 100))
    out.push({ key: 'zip', test: (_, d) => milesBetween(origin.lat, origin.lng, d.lat, d.lng) <= radius })
  }
  const bbox = p.get('bbox')?.split(',').map(Number)
  if (bbox && bbox.length === 4 && bbox.every((n) => Number.isFinite(n))) {
    const [w, s, e, n] = bbox
    out.push({ key: 'bbox', test: (_, d) => d.lng >= w && d.lng <= e && d.lat >= s && d.lat <= n })
  }
  const vin = p.get('vin')?.toUpperCase().trim()
  if (vin) {
    const re = new RegExp('^' + vin.replace(/[^A-Z0-9?]/g, '').replace(/\?/g, '.'))
    out.push({ key: 'vin', test: (l) => re.test(l.vin) })
  }
  return out
}

function run(p: URLSearchParams, skip: string[] = []): Listing[] {
  const { listings, dealerById } = getStore()
  const preds = predicates(p).filter((x) => !skip.includes(x.key))
  return listings.filter((l) => { const d = dealerById.get(l.dealerId)!; return preds.every((x) => x.test(l, d)) })
}

export function toView(l: Listing, origin: Point | null): ListingView {
  const dealer = getStore().dealerById.get(l.dealerId)!
  return { ...l, dealer, discount: discountOf(l), distance: origin ? Math.round(milesBetween(origin.lat, origin.lng, dealer.lat, dealer.lng)) : null }
}

const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => (a == null ? 1 : b == null ? -1 : (a - b) * dir)

export function search(p: URLSearchParams, opts: { offset?: number; limit?: number; hidden?: string[] } = {}) {
  const origin = locateZip(p.get('zip')) ?? locateZip(p.get('near'))
  let rows = run(p)
  if (opts.hidden?.length) { const h = new Set(opts.hidden); rows = rows.filter((l) => !h.has(l.vin)) }
  const sort = p.get('sort') ?? (origin ? 'closest' : 'newest')
  const store = getStore()
  const dist = (l: Listing) => { const d = store.dealerById.get(l.dealerId)!; return origin ? milesBetween(origin.lat, origin.lng, d.lat, d.lng) : 0 }
  const age = (l: Listing) => l.daysListed - (l.soldDay ?? 0)
  const cmp: Record<string, (a: Listing, b: Listing) => number> = {
    newest: (a, b) => (p.get('status') === 'sold' ? a.soldDay! - b.soldDay! : a.daysListed - b.daysListed),
    oldest: (a, b) => age(b) - age(a),
    price_asc: (a, b) => nullsLast(a.price, b.price, 1),
    price_desc: (a, b) => nullsLast(a.price, b.price, -1),
    msrp_asc: (a, b) => a.msrp - b.msrp,
    msrp_desc: (a, b) => b.msrp - a.msrp,
    miles_asc: (a, b) => a.miles - b.miles,
    miles_desc: (a, b) => b.miles - a.miles,
    discount: (a, b) => nullsLast(discountOf(a), discountOf(b), -1),
    closest: (a, b) => dist(a) - dist(b),
  }
  rows = [...rows].sort(cmp[sort] ?? cmp.newest)
  const offset = Math.max(0, Math.trunc(opts.offset ?? 0) || 0)
  const limit = Math.max(1, Math.min(60, Math.trunc(opts.limit ?? 24) || 24))
  return {
    total: rows.length,
    origin,
    stats: { price: stats(rows.map((l) => l.price)), miles: stats(rows.map((l) => l.miles)), days: stats(rows.map(age)) },
    items: rows.slice(offset, offset + limit).map((l) => toView(l, origin)),
  }
}

export function stats(values: (number | null)[]): RangeStats | null {
  const v = values.filter((x): x is number => x != null).sort((a, b) => a - b)
  if (!v.length) return null
  const q = (f: number) => v[Math.min(v.length - 1, Math.floor(f * (v.length - 1) + 0.5))]
  return { min: v[0], max: v[v.length - 1], median: q(0.5), p25: q(0.25), p75: q(0.75), mean: Math.round(v.reduce((s, x) => s + x, 0) / v.length) }
}

/** Option counts for every facet, each computed against all *other* filters. */
export function facets(p: URLSearchParams, keys?: string[]) {
  const store = getStore()
  const result: Record<string, FacetOption[]> = {}
  for (const f of FACETS) {
    if (keys && !keys.includes(f.key)) continue
    // "must have all" facets keep their own filter: the count is what adding the option would leave
    const rows = run(p, f.all ? [] : [f.key])
    const acc = new Map<string, { count: number; priceSum: number; priced: number; days: number }>()
    for (const l of rows) {
      const v = f.get(l, store.dealerById.get(l.dealerId)!)
      for (const x of Array.isArray(v) ? v : [v]) {
        let a = acc.get(x)
        if (!a) acc.set(x, (a = { count: 0, priceSum: 0, priced: 0, days: 0 }))
        a.count++
        if (l.price != null) { a.priceSum += l.price; a.priced++ }
        a.days += l.daysListed - (l.soldDay ?? 0)
      }
    }
    const options: FacetOption[] = Array.from(acc, ([value, a]) => ({ value, count: a.count, avgPrice: a.priced ? Math.round(a.priceSum / a.priced) : null, avgDays: Math.round(a.days / a.count) }))
    options.sort((a, b) => (f.sort === 'alpha' ? a.value.localeCompare(b.value, 'en', { numeric: true }) : f.sort === 'desc' ? b.value.localeCompare(a.value, 'en', { numeric: true }) : b.count - a.count))
    result[f.key] = options
  }
  const ranges: Record<string, RangeStats | null> = {}
  for (const r of RANGES) ranges[r.key] = stats(run(p, [`${r.key}_range`]).map((l) => rangeValue(r.key, l)))
  return { total: run(p).length, facets: result, ranges }
}

/** Dealer-level pins for the map: every match in the filter set, ignoring the map box. */
export function mapPins(p: URLSearchParams) {
  const store = getStore()
  const pins = new Map<string, { id: string; name: string; lat: number; lng: number; city: string; state: string; count: number; minPrice: number | null }>()
  for (const l of run(p, ['bbox'])) {
    const d = store.dealerById.get(l.dealerId)!
    let pin = pins.get(d.id)
    if (!pin) pins.set(d.id, (pin = { id: d.id, name: d.name, lat: d.lat, lng: d.lng, city: d.city, state: d.state, count: 0, minPrice: null }))
    pin.count++
    if (l.price != null && (pin.minPrice == null || l.price < pin.minPrice)) pin.minPrice = l.price
  }
  return Array.from(pins.values())
}

/** Price × mileage grid, computed without the price and mileage filters so it stays put while you pick cells. */
export function heatmap(p: URLSearchParams, cols = 8, rowsN = 6) {
  const rows = run(p, ['price_range', 'miles_range']).filter((l) => l.price != null)
  if (rows.length < 8) return null
  const ps = stats(rows.map((l) => l.price))!, ms = stats(rows.map((l) => l.miles))!
  const nice = (lo: number, hi: number, n: number, unit: number) => {
    const step = Math.max(unit, Math.ceil((hi - lo) / n / unit) * unit)
    const start = Math.floor(lo / unit) * unit
    return Array.from({ length: n + 1 }, (_, i) => start + i * step)
  }
  // trim outliers so a single exotic doesn't flatten the grid
  const q = (arr: number[], f: number) => arr[Math.floor(f * (arr.length - 1))]
  const sortedP = rows.map((l) => l.price!).sort((a, b) => a - b), sortedM = rows.map((l) => l.miles).sort((a, b) => a - b)
  const priceEdges = nice(q(sortedP, 0.02), q(sortedP, 0.98), rowsN, 1000)
  const mileEdges = nice(Math.max(0, q(sortedM, 0.02)), q(sortedM, 0.98), cols, 5000)
  const cells = Array.from({ length: rowsN }, () => Array(cols).fill(0) as number[])
  for (const l of rows) {
    const r = Math.min(rowsN - 1, Math.max(0, Math.floor((l.price! - priceEdges[0]) / (priceEdges[1] - priceEdges[0]))))
    const c = Math.min(cols - 1, Math.max(0, Math.floor((l.miles - mileEdges[0]) / (mileEdges[1] - mileEdges[0]))))
    cells[r][c]++
  }
  return { priceEdges, mileEdges, cells, max: Math.max(...cells.flat()), priceRange: [ps.min, ps.max], mileRange: [ms.min, ms.max] }
}

// ---------------------------------------------------------------- market data

const priceOn = (l: Listing, day: number) => {
  let price: number | null = null
  for (const h of l.history) if (h.day >= day) price = h.price
  return price
}
const activeOn = (l: Listing, day: number) => l.daysListed >= day && (l.soldDay == null || l.soldDay < day)

export interface MarketSummary {
  active: number; newCount: number; usedCount: number
  avgPrice: number | null; medianPrice: number | null; avgMiles: number | null; avgDays: number | null
  sold30: number; avgDaysToSell: number | null; daysSupply: number | null
  change30: number | null
}

export function marketSummary(rows: Listing[]): MarketSummary {
  const active = rows.filter((l) => l.status === 'active')
  const sold = rows.filter((l) => l.status === 'sold')
  const sold30 = sold.filter((l) => l.soldDay! <= 30)
  const ps = stats(active.map((l) => l.price))
  const then = stats(rows.filter((l) => activeOn(l, 30)).map((l) => priceOn(l, 30)))
  return {
    active: active.length,
    newCount: active.filter((l) => l.condition === 'new').length,
    usedCount: active.filter((l) => l.condition !== 'new').length,
    avgPrice: ps?.mean ?? null, medianPrice: ps?.median ?? null,
    avgMiles: stats(active.map((l) => l.miles))?.mean ?? null,
    avgDays: stats(active.map((l) => l.daysListed))?.mean ?? null,
    sold30: sold30.length,
    avgDaysToSell: stats(sold.map((l) => l.daysListed - l.soldDay!))?.mean ?? null,
    daysSupply: sold30.length ? Math.round(active.length / (sold30.length / 30)) : null,
    change30: ps && then ? Math.round(((ps.mean - then.mean) / then.mean) * 1000) / 10 : null,
  }
}

/** Weekly series (oldest first) of inventory, average asking price and miles. */
export function weeklySeries(rows: Listing[], weeks = 21) {
  const out: { day: number; count: number; avgPrice: number | null; avgMiles: number | null; listed: number; sold: number }[] = []
  for (let w = weeks; w >= 0; w--) {
    const day = w * 7
    const live = rows.filter((l) => activeOn(l, day) || (day === 0 && l.status === 'active'))
    out.push({
      day, count: live.length,
      avgPrice: stats(live.map((l) => priceOn(l, day)))?.mean ?? null,
      avgMiles: stats(live.map((l) => l.miles))?.mean ?? null,
      listed: rows.filter((l) => l.daysListed >= day && l.daysListed < day + 7).length,
      sold: rows.filter((l) => l.soldDay != null && l.soldDay >= day && l.soldDay < day + 7).length,
    })
  }
  return out
}

export function groupSummary(rows: Listing[], by: (l: Listing, d: Dealer) => string) {
  const store = getStore()
  const groups = new Map<string, Listing[]>()
  for (const l of rows) {
    const k = by(l, store.dealerById.get(l.dealerId)!)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(l)
  }
  return Array.from(groups, ([key, list]) => ({ key, ...marketSummary(list) })).sort((a, b) => b.active - a.active)
}

export const modelRows = (make: string, model?: string, extra?: (l: Listing) => boolean) =>
  getStore().listings.filter((l) => l.make === make && (!model || l.model === model) && (!extra || extra(l)))

/** Comparable active listings for the leaderboard on a listing page. */
export function comparables(l: Listing, opts: { trim: boolean; miles: boolean; year: boolean; local: boolean; sold: boolean }) {
  const store = getStore()
  const me = store.dealerById.get(l.dealerId)!
  const origin: Point = { lat: me.lat, lng: me.lng, label: '' }
  const rows = store.listings.filter((x) => {
    if (x.make !== l.make || x.model !== l.model || x.price == null) return false
    if (x.vin !== l.vin && x.status !== (opts.sold ? 'sold' : 'active')) return false
    if ((x.condition === 'new') !== (l.condition === 'new')) return false
    if (opts.trim && x.trim !== l.trim) return false
    if (opts.year && Math.abs(x.year - l.year) > 1) return false
    if (opts.miles && Math.abs(x.miles - l.miles) > 15000) return false
    if (opts.local) { const d = store.dealerById.get(x.dealerId)!; if (milesBetween(me.lat, me.lng, d.lat, d.lng) > 250) return false }
    return true
  })
  rows.sort((a, b) => a.price! - b.price!)
  const idx = rows.findIndex((x) => x.vin === l.vin)
  // only a window around this listing is sent, and only the fields the table shows
  const from = Math.max(0, Math.min(idx - 4, rows.length - 12))
  const items = rows.slice(from, from + 12).map((x) => {
    const d = store.dealerById.get(x.dealerId)!
    return { vin: x.vin, year: x.year, version: x.version, extColor: x.extColor, price: x.price!, miles: x.miles, city: d.city, state: d.state, distance: Math.round(milesBetween(origin.lat, origin.lng, d.lat, d.lng)) }
  })
  return { rank: idx + 1, total: rows.length, from, items, stats: stats(rows.map((x) => x.price)) }
}

/** Stable short code for share links. */
export const shortCode = (vin: string) => vin.slice(9) + vin.slice(3, 6)
export const fromShortCode = (code: string) => getStore().listings.find((l) => shortCode(l.vin) === code.toUpperCase())

export { FACET_BY_KEY }
