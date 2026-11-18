// Real inventory: turns the crawler's snapshot (data/inventory.json.gz) into the
// store the rest of the app reads. Anything a dealer site does not tell us
// (title status, previous use, factory options) is left as unknown rather
// than guessed.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import zipcodes from 'zipcodes'
import type { Snapshot, TrackedListing } from '@/crawler/types'
import { MAKES, MODELS } from './catalog'
import type { Store } from './seed'
import type { Dealer, Listing } from './types'

const FILE = path.join(process.cwd(), 'data', 'inventory.json.gz')
// the pilot region: the New York metro, measured from Midtown Manhattan
const REGION_STATES = new Set(['NY', 'NJ', 'CT'])
const REGION_CENTER: [number, number] = [40.75, -73.99]
const milesBetween = (p: [number, number], q: [number, number]) => {
  const r = Math.PI / 180, x = (q[1] - p[1]) * r * Math.cos(((p[0] + q[0]) / 2) * r), y = (q[0] - p[0]) * r
  return Math.sqrt(x * x + y * y) * 3959
}
const REGION_MILES = 100

const title = (s: string) => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, a, b) => a + b.toUpperCase())
const CANON = new Map(MAKES.map((m) => [m.toLowerCase(), m]))
const makeName = (raw: string) => CANON.get(raw.toLowerCase()) ?? (raw === raw.toUpperCase() && raw.length > 3 ? title(raw) : raw)

function body(decoded: string) {
  const b = decoded.toLowerCase()
  if (b.includes('pickup')) return 'Pickup'
  if (b.includes('minivan')) return 'Minivan'
  if (b.includes('sport utility') || b.includes('crossover')) return 'SUV'
  if (b.includes('convertible') || b.includes('cabriolet') || b.includes('roadster')) return 'Convertible'
  if (b.includes('coupe')) return 'Coupe'
  if (b.includes('wagon')) return 'Wagon'
  if (b.includes('hatchback')) return 'Hatchback'
  if (b.includes('sedan')) return 'Sedan'
  if (b.includes('van')) return 'Van'
  return 'Other'
}

function drive(dealer: string, decoded: string) {
  for (const s of [dealer, decoded]) {
    const d = s.toLowerCase()
    if (/all[- ]wheel|awd/.test(d)) return 'AWD'
    if (/4[- ]?wheel|four[- ]wheel|4x4|4wd/.test(d)) return '4WD'
    if (/front[- ]wheel|fwd/.test(d)) return 'FWD'
    if (/rear[- ]wheel|rwd|4x2/.test(d)) return 'RWD'
  }
  return 'Unknown'
}

function power(l: TrackedListing): { fuel: string; powertrain: string } {
  const e = (l.decoded?.electrification ?? '').toUpperCase()
  const f = `${l.fuel} ${l.decoded?.fuel ?? ''}`.toLowerCase()
  if (e.startsWith('BEV') || /battery electric|^electric/.test(l.fuel.toLowerCase())) return { fuel: 'Electric', powertrain: 'BEV' }
  if (e.startsWith('PHEV') || /plug-?in/.test(f)) return { fuel: 'Plug-in Hybrid', powertrain: 'PHEV' }
  if (e.startsWith('FCEV') || /hydrogen|fuel cell/.test(f)) return { fuel: 'Hydrogen', powertrain: 'FCEV' }
  if (e.includes('MILD')) return { fuel: 'Hybrid', powertrain: 'MHEV' }
  if (e.includes('HEV') || /hybrid/.test(f)) return { fuel: 'Hybrid', powertrain: 'HEV' }
  if (/diesel/.test(f)) return { fuel: 'Diesel', powertrain: 'ICE' }
  return { fuel: 'Gasoline', powertrain: 'ICE' }
}

function transmission(raw: string, powertrain: string) {
  const t = raw.toLowerCase()
  if (/manual|m\/t/.test(t) && !/auto/.test(t)) return 'Manual'
  if (/cvt|continuously|variable/.test(t)) return 'CVT'
  if (powertrain === 'BEV' || /single|1-speed/.test(t)) return 'Single-speed'
  return 'Automatic'
}

const daysAgo = (date: string, now: number) => Math.max(0, Math.floor((now - Date.parse(`${date}T00:00:00Z`)) / 86400000))
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296 }
const median = (v: number[]) => (v.length ? [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] : 0)

export function snapshotExists() {
  return existsSync(FILE)
}

export function buildRealStore(): Store | null {
  if (!existsSync(FILE)) return null
  const snap = JSON.parse(gunzipSync(readFileSync(FILE)).toString('utf8')) as Snapshot
  if (!snap.listings?.length) return null
  const now = Date.now()

  const docFees = new Map<string, number[]>()
  for (const l of snap.listings) {
    const fee = l.fees.find((f) => /dealer fee|doc/i.test(f.label) && !f.total)?.amount
    if (fee && fee > 0) { if (!docFees.has(l.dealerId)) docFees.set(l.dealerId, []); docFees.get(l.dealerId)!.push(fee) }
  }

  // A group's rooftop can appear on several of the group's sites: keep it once.
  // Lots outside the region (a group's far-away stores) are left out.
  const canon = new Map<string, string>()
  const firstByAccount = new Map<string, string>()
  const kept = snap.dealers.filter((d) => {
    const z = zipcodes.lookup(d.zip)
    if (!REGION_STATES.has(d.state.toUpperCase()) || (z && milesBetween(REGION_CENTER, [z.latitude, z.longitude]) > REGION_MILES)) return false
    const account = `${d.id.split('#')[1] ?? d.id}|${d.zip}`
    const first = firstByAccount.get(account)
    if (first) { canon.set(d.id, first); return false }
    firstByAccount.set(account, d.id); canon.set(d.id, d.id)
    return true
  })
  const dealers: Dealer[] = kept.map((d) => {
    const z = zipcodes.lookup(d.zip)
    // dealers that share a ZIP code are nudged apart so their map pins do not stack
    const lat = (z?.latitude ?? 40.75) + (hash(d.id) - 0.5) * 0.02
    const lng = (z?.longitude ?? -73.98) + (hash(`${d.id}x`) - 0.5) * 0.026
    const digits = d.phone.replace(/\D/g, '').slice(-10)
    return {
      id: d.id, name: d.name, group: null, type: 'franchise',
      // shouty street names are calmed down; short tokens such as NJ, NY or 11TH are left alone
      address: d.address.replace(/\b[A-Z]{4,}\b/g, (w) => w[0] + w.slice(1).toLowerCase()), city: (d.city === d.city.toUpperCase() || d.city === d.city.toLowerCase() ? title(d.city) : d.city).replace(/^New York City$/i, 'New York'), state: d.state, zip: d.zip, lat, lng,
      phone: digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : d.phone,
      docFee: median(docFees.get(d.id) ?? []),
      site: `https://${d.host}`,
    }
  })
  // several rooftops can share one trading name; add the street so each is distinct as a filter value
  const names = new Map<string, number>()
  for (const d of dealers) names.set(d.name, (names.get(d.name) ?? 0) + 1)
  for (const d of dealers) if (names.get(d.name)! > 1) d.name = `${d.name} (${d.address})`
  const dealerById = new Map(dealers.map((d) => [d.id, d]))

  const listings: Listing[] = []
  for (const l of snap.listings) {
    const dealerId = canon.get(l.dealerId)
    if (!dealerId) continue
    const make = makeName(l.make)
    const def = MODELS.find((m) => m.make === make && m.model.toLowerCase() === l.model.toLowerCase())
    // only named generations are useful; the wider catalog just has year spans
    const gen = def?.gens.find((g) => l.year >= g.from && l.year <= g.to && !/^\d{4}/.test(g.name))
    const { fuel, powertrain } = power(l)
    const dec = l.decoded
    const trim = l.trim || 'Base'
    // placeholder prices such as $1 or $99 mean "call for price"
    const price = l.price != null && l.price >= 1000 ? l.price : null
    const msrp = l.condition === 'new' ? l.msrp ?? price ?? 0 : price ?? 0
    const history = l.history.filter(([, p]) => p >= 1000).map(([date, p, miles]) => ({ day: daysAgo(date, now), price: p, miles }))
    const cyl = dec?.cylinders ?? 0
    listings.push({
      vin: l.vin, stock: l.stock,
      status: l.goneOn ? 'sold' : 'active',
      condition: l.condition,
      certProgram: l.condition === 'certified' ? `${make} Certified Pre-Owned` : null,
      year: l.year, make, model: def?.model ?? l.model, generation: gen?.name ?? '',
      trim, version: trim,
      body: dec?.body ? body(dec.body) : def?.body ?? 'Other',
      seats: dec?.seats || def?.seats || 5, doors: dec?.doors || def?.doors || 4,
      fuel, powertrain,
      engine: l.engine || (dec?.displacement ? `${dec.displacement}L${cyl ? ` ${cyl}-cyl` : ''}` : powertrain === 'BEV' ? 'Electric' : 'Not listed'),
      cylinders: powertrain === 'BEV' ? 0 : cyl,
      drivetrain: drive(l.drivetrain, dec?.drive ?? ''),
      transmission: transmission(l.transmission, powertrain),
      extColor: l.extColor && l.extColor !== 'Other' ? l.extColor : 'Unknown', extColorName: l.extColorName || 'Not listed',
      intColor: l.intColor && l.intColor.length < 20 ? l.intColor : 'Unknown',
      price, baseMsrp: msrp, msrp, miles: l.miles,
      options: [], features: [],
      title: l.condition === 'new' ? 'Clean' : 'Unknown',
      prevUse: l.condition === 'new' ? 'None (new)' : 'Not reported',
      availability: 'On lot',
      plant: dec?.plantCity ? title(dec.plantCity) : 'Not listed',
      country: dec?.plantCountry ? title(dec.plantCountry.replace(/\s*\(.*\)/, '')) : 'Unknown',
      dealerId,
      daysListed: daysAgo(l.firstSeen, now),
      soldDay: l.goneOn ? daysAgo(l.goneOn, now) : null,
      history, previousSellers: [],
      photo: l.photo, url: l.url, fees: l.fees,
    })
  }
  // a car can show on two sites of the same group; keep one copy, preferring the one still for sale
  const byVin = new Map<string, Listing>()
  for (const l of listings) { const cur = byVin.get(l.vin); if (!cur || (cur.status === 'sold' && l.status === 'active')) byVin.set(l.vin, l) }
  const unique = Array.from(byVin.values())
  return {
    listings: unique, dealers, dealerById, byVin,
    source: 'crawl', generatedAt: snap.generatedAt, region: snap.region,
    trackingSince: snap.listings.reduce((min, l) => (l.lastSeen && (!min || l.lastSeen < min) ? l.lastSeen : min), '') || snap.generatedAt.slice(0, 10),
  }
}
