// Filter definitions shared by server and client. URL query strings are the
// single source of truth for a search: every filter lives in the address bar.
import type { Dealer, Listing } from './types'

export type Group = 'basics' | 'vehicle' | 'colors' | 'location' | 'powertrain' | 'equipment' | 'body' | 'history'

export const GROUPS: { id: Group; label: string }[] = [
  { id: 'basics', label: 'Condition, price & miles' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'colors', label: 'Colors' },
  { id: 'location', label: 'Location & seller' },
  { id: 'powertrain', label: 'Powertrain' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'body', label: 'Body & seating' },
  { id: 'history', label: 'Listing & history' },
]

export interface FacetDef {
  key: string
  label: string
  group: Group
  /** array-valued facets match when the listing has every selected value */
  all?: boolean
  get: (l: Listing, d: Dealer) => string | string[]
  /** only offer this facet once these other facets have a selection */
  needs?: string[]
  sort?: 'count' | 'alpha' | 'desc'
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const FACETS: FacetDef[] = [
  { key: 'condition', label: 'Condition', group: 'basics', get: (l) => cap(l.condition) },
  { key: 'title', label: 'Title status', group: 'basics', get: (l) => l.title },
  { key: 'prev_use', label: 'Previous use', group: 'basics', get: (l) => l.prevUse },
  { key: 'cert', label: 'Certification program', group: 'basics', get: (l) => l.certProgram ?? [] },
  { key: 'make', label: 'Make', group: 'vehicle', get: (l) => l.make, sort: 'alpha' },
  { key: 'model', label: 'Model', group: 'vehicle', get: (l) => l.model, needs: ['make'] },
  { key: 'generation', label: 'Generation', group: 'vehicle', get: (l) => l.generation, needs: ['model'], sort: 'desc' },
  { key: 'year', label: 'Model year', group: 'vehicle', get: (l) => String(l.year), sort: 'desc' },
  { key: 'trim', label: 'Trim', group: 'vehicle', get: (l) => l.trim, needs: ['model'] },
  { key: 'version', label: 'Version', group: 'vehicle', get: (l) => l.version, needs: ['model'] },
  { key: 'ext_color', label: 'Exterior color', group: 'colors', get: (l) => l.extColor },
  { key: 'ext_color_name', label: 'Manufacturer color name', group: 'colors', get: (l) => l.extColorName },
  { key: 'int_color', label: 'Interior color', group: 'colors', get: (l) => l.intColor },
  { key: 'state', label: 'State', group: 'location', get: (_, d) => d.state, sort: 'alpha' },
  { key: 'dealer_type', label: 'Seller type', group: 'location', get: (_, d) => cap(d.type) },
  { key: 'dealer_group', label: 'Dealer group', group: 'location', get: (_, d) => d.group ?? [] },
  { key: 'dealer', label: 'Dealer', group: 'location', get: (_, d) => d.name },
  { key: 'fuel', label: 'Fuel type', group: 'powertrain', get: (l) => l.fuel },
  { key: 'powertrain', label: 'Powertrain type', group: 'powertrain', get: (l) => l.powertrain },
  { key: 'drivetrain', label: 'Drivetrain', group: 'powertrain', get: (l) => l.drivetrain },
  { key: 'transmission', label: 'Transmission', group: 'powertrain', get: (l) => l.transmission },
  { key: 'cylinders', label: 'Cylinders', group: 'powertrain', get: (l) => (l.cylinders ? String(l.cylinders) : 'None (electric)') },
  { key: 'engine', label: 'Engine', group: 'powertrain', get: (l) => l.engine },
  { key: 'option', label: 'Installed options', group: 'equipment', all: true, get: (l) => l.options.map((o) => o.name) },
  { key: 'feature', label: 'Top features', group: 'equipment', all: true, get: (l) => l.features },
  { key: 'body', label: 'Body type', group: 'body', get: (l) => l.body },
  { key: 'seats', label: 'Seats', group: 'body', get: (l) => String(l.seats), sort: 'alpha' },
  { key: 'doors', label: 'Doors', group: 'body', get: (l) => String(l.doors), sort: 'alpha' },
  { key: 'availability', label: 'Availability', group: 'history', get: (l) => l.availability },
  { key: 'country', label: 'Assembly country', group: 'history', get: (l) => l.country },
  { key: 'plant', label: 'Assembly plant', group: 'history', get: (l) => l.plant },
]
export const FACET_BY_KEY = new Map(FACETS.map((f) => [f.key, f]))

export interface RangeDef {
  key: string
  label: string
  group: Group
  unit: '$' | 'mi' | 'days' | 'yr' | '%'
  step: number
}
export const RANGES: RangeDef[] = [
  { key: 'price', label: 'List price', group: 'basics', unit: '$', step: 500 },
  { key: 'miles', label: 'Mileage', group: 'basics', unit: 'mi', step: 1000 },
  { key: 'msrp', label: 'Total MSRP', group: 'basics', unit: '$', step: 500 },
  { key: 'year', label: 'Model year range', group: 'vehicle', unit: 'yr', step: 1 },
  { key: 'days', label: 'Days for sale', group: 'history', unit: 'days', step: 1 },
  { key: 'discount', label: 'Discount from MSRP', group: 'history', unit: '%', step: 1 },
]

export const SORTS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest listings' },
  { value: 'oldest', label: 'Oldest listings' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
  { value: 'msrp_asc', label: 'Lowest MSRP' },
  { value: 'msrp_desc', label: 'Highest MSRP' },
  { value: 'miles_asc', label: 'Lowest miles' },
  { value: 'miles_desc', label: 'Highest miles' },
  { value: 'discount', label: 'Best discount from MSRP' },
  { value: 'closest', label: 'Closest to me' },
]

/** Multi-value params are comma separated, so a comma inside a value is escaped. */
export const encodeValue = (v: string) => v.replace(/%/g, '%25').replace(/,/g, '%2C')
const decodeValue = (v: string) => v.replace(/%2C/g, ',').replace(/%25/g, '%')
const split = (v: string | null | undefined) => (v ? v.split(',').map((s) => decodeValue(s.trim())).filter(Boolean) : [])

/** Read a multi-value param. */
export const getValues = (p: URLSearchParams, key: string) => split(p.get(key))

export function toggleValue(p: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(p)
  const cur = getValues(next, key)
  const has = cur.includes(value)
  const out = has ? cur.filter((v) => v !== value) : [...cur, value]
  if (out.length) next.set(key, out.map(encodeValue).join(','))
  else next.delete(key)
  // dependent selections are meaningless once their parent changes
  if (key === 'make') ['model', 'generation', 'trim', 'version'].forEach((k) => { next.delete(k); next.delete(`exclude_${k}`) })
  if (key === 'model') ['generation', 'trim', 'version'].forEach((k) => { next.delete(k); next.delete(`exclude_${k}`) })
  return next
}

export interface Chip { key: string; label: string; remove: (p: URLSearchParams) => URLSearchParams }

const fmtNum = (n: string, unit: string) => {
  const v = Number(n)
  if (unit === '$') return `$${v.toLocaleString('en-US')}`
  if (unit === 'mi') return `${v.toLocaleString('en-US')} mi`
  if (unit === 'days') return `${v} days`
  if (unit === '%') return `${v}%`
  return String(v)
}

/** Human-readable chips for every active filter in a query string. */
export function describe(p: URLSearchParams): Chip[] {
  const chips: Chip[] = []
  const drop = (...keys: string[]) => (q: URLSearchParams) => { const n = new URLSearchParams(q); keys.forEach((k) => n.delete(k)); return n }
  if (p.get('status') === 'sold') chips.push({ key: 'status', label: 'Recently sold', remove: drop('status') })
  for (const f of FACETS) {
    for (const v of getValues(p, f.key)) chips.push({ key: `${f.key}:${v}`, label: v, remove: (q) => toggleValue(q, f.key, v) })
    for (const v of getValues(p, `exclude_${f.key}`)) chips.push({ key: `x${f.key}:${v}`, label: `Not ${v}`, remove: (q) => toggleValue(q, `exclude_${f.key}`, v) })
  }
  for (const r of RANGES) {
    const min = p.get(`${r.key}_min`), max = p.get(`${r.key}_max`)
    if (!min && !max) continue
    const label = min && max ? `${fmtNum(min, r.unit)} – ${fmtNum(max, r.unit)}` : min ? `${fmtNum(min, r.unit)}+` : `Up to ${fmtNum(max!, r.unit)}`
    chips.push({ key: r.key, label: r.unit === 'yr' || r.unit === '$' ? label : `${r.label}: ${label}`, remove: drop(`${r.key}_min`, `${r.key}_max`) })
  }
  if (p.get('zip')) chips.push({ key: 'zip', label: `Within ${p.get('radius') || '100'} mi of ${p.get('zip')}`, remove: drop('zip', 'radius') })
  if (p.get('bbox')) chips.push({ key: 'bbox', label: 'Map area', remove: drop('bbox') })
  if (p.get('vin')) chips.push({ key: 'vin', label: `VIN ${p.get('vin')}`, remove: drop('vin') })
  return chips
}

/** A short title for a search, e.g. "Used Toyota RAV4 under $30,000". */
export function summarize(p: URLSearchParams): string {
  const parts: string[] = []
  const cond = getValues(p, 'condition')
  if (cond.length && cond.length < 3) parts.push(cond.join(' & '))
  const years = getValues(p, 'year')
  if (years.length === 1) parts.push(years[0])
  else if (p.get('year_min') || p.get('year_max')) parts.push(`${p.get('year_min') ?? ''}–${p.get('year_max') ?? ''}`)
  parts.push(...getValues(p, 'make'), ...getValues(p, 'model'), ...getValues(p, 'trim'))
  if (!getValues(p, 'make').length) parts.push(...getValues(p, 'body').map((b) => `${b}s`))
  const lo = p.get('price_min'), hi = p.get('price_max')
  const usd = (v: string) => `$${Number(v).toLocaleString('en-US')}`
  if (lo && hi) parts.push(`${usd(lo)}–${usd(hi)}`)
  else if (hi) parts.push(`under ${usd(hi)}`)
  else if (lo) parts.push(`over ${usd(lo)}`)
  if (p.get('zip')) parts.push(`near ${p.get('zip')}`)
  return parts.join(' ') || 'All vehicles'
}

/** Params that describe filters (as opposed to view state like sort/layout). */
export function filterParams(p: URLSearchParams) {
  const n = new URLSearchParams(p)
  ;['sort', 'layout', 'map', 'tab', 'rank'].forEach((k) => n.delete(k))
  return n
}
