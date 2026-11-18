// Deterministic demo inventory. Everything here is synthetic: dealers, VINs,
// prices and histories are generated so the product can be exercised end to
// end before a licensed listings feed is connected (see lib/data/store.ts).
import { EXT_COLORS, INT_COLORS, INT_WEIGHTS, MAKES, MODELS, OPTION_POOL, WMI, type ModelDef } from './catalog'
import type { Dealer, InstalledOption, Listing, PreviousSeller, PricePoint } from './types'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// [city, state, zip, lat, lng, relative size]
const CITIES: [string, string, string, number, number, number][] = [
  ['New York', 'NY', '10001', 40.75, -73.99, 5], ['Los Angeles', 'CA', '90012', 34.06, -118.24, 5],
  ['Chicago', 'IL', '60601', 41.88, -87.62, 4], ['Houston', 'TX', '77002', 29.76, -95.37, 4],
  ['Phoenix', 'AZ', '85004', 33.45, -112.07, 3], ['Philadelphia', 'PA', '19103', 39.95, -75.17, 3],
  ['San Antonio', 'TX', '78205', 29.42, -98.49, 2], ['San Diego', 'CA', '92101', 32.72, -117.16, 3],
  ['Dallas', 'TX', '75201', 32.79, -96.8, 4], ['San Jose', 'CA', '95113', 37.33, -121.89, 2],
  ['Austin', 'TX', '78701', 30.27, -97.74, 3], ['Jacksonville', 'FL', '32202', 30.33, -81.66, 2],
  ['Columbus', 'OH', '43215', 39.96, -83.0, 2], ['Charlotte', 'NC', '28202', 35.23, -80.84, 2],
  ['Indianapolis', 'IN', '46204', 39.77, -86.16, 2], ['San Francisco', 'CA', '94103', 37.77, -122.41, 2],
  ['Seattle', 'WA', '98101', 47.61, -122.33, 3], ['Denver', 'CO', '80202', 39.75, -104.99, 3],
  ['Washington', 'DC', '20001', 38.91, -77.02, 3], ['Boston', 'MA', '02108', 42.36, -71.06, 3],
  ['Nashville', 'TN', '37203', 36.16, -86.78, 2], ['Detroit', 'MI', '48226', 42.33, -83.05, 3],
  ['Portland', 'OR', '97204', 45.52, -122.68, 2], ['Las Vegas', 'NV', '89101', 36.17, -115.14, 2],
  ['Memphis', 'TN', '38103', 35.15, -90.05, 1], ['Louisville', 'KY', '40202', 38.25, -85.76, 1],
  ['Baltimore', 'MD', '21201', 39.29, -76.61, 2], ['Milwaukee', 'WI', '53202', 43.04, -87.91, 1],
  ['Albuquerque', 'NM', '87102', 35.08, -106.65, 1], ['Tucson', 'AZ', '85701', 32.22, -110.97, 1],
  ['Sacramento', 'CA', '95814', 38.58, -121.49, 2], ['Kansas City', 'MO', '64106', 39.1, -94.58, 2],
  ['Atlanta', 'GA', '30303', 33.75, -84.39, 4], ['Miami', 'FL', '33130', 25.77, -80.19, 4],
  ['Raleigh', 'NC', '27601', 35.78, -78.64, 2], ['Omaha', 'NE', '68102', 41.26, -95.93, 1],
  ['Minneapolis', 'MN', '55401', 44.98, -93.27, 2], ['Tampa', 'FL', '33602', 27.95, -82.46, 3],
  ['New Orleans', 'LA', '70112', 29.95, -90.07, 1], ['Cleveland', 'OH', '44113', 41.5, -81.69, 2],
  ['Orlando', 'FL', '32801', 28.54, -81.38, 3], ['Pittsburgh', 'PA', '15222', 40.44, -80.0, 2],
  ['Cincinnati', 'OH', '45202', 39.1, -84.51, 2], ['St. Louis', 'MO', '63101', 38.63, -90.2, 2],
  ['Salt Lake City', 'UT', '84101', 40.76, -111.89, 2], ['Boise', 'ID', '83702', 43.62, -116.2, 1],
  ['Richmond', 'VA', '23219', 37.54, -77.44, 1], ['Oklahoma City', 'OK', '73102', 35.47, -97.52, 1],
  ['Hartford', 'CT', '06103', 41.76, -72.67, 1], ['Buffalo', 'NY', '14202', 42.89, -78.88, 1],
  ['Birmingham', 'AL', '35203', 33.52, -86.8, 1], ['Charleston', 'SC', '29401', 32.78, -79.93, 1],
  ['Des Moines', 'IA', '50309', 41.59, -93.62, 1], ['Anchorage', 'AK', '99501', 61.22, -149.9, 1],
  ['Honolulu', 'HI', '96813', 21.31, -157.86, 1], ['Billings', 'MT', '59101', 45.78, -108.5, 1],
]

const GROUPS = ['Summit Auto Group', 'Lakeshore Automotive', 'Crestline Motors', 'Heritage Auto Collection', 'Pinnacle Dealer Group']
const INDIE = ['Northside', 'Eastgate', 'Riverbend', 'Maple Street', 'Cornerstone', 'Liberty', 'Sunrise', 'Parkway', 'Ridgeline', 'Harbor']
const INDIE_SUFFIX = ['Auto Sales', 'Motors', 'Pre-Owned', 'Auto Outlet', 'Car Company']
const STREETS = ['Main St', 'Auto Mall Pkwy', 'Commerce Dr', 'Highway 1', 'Motor Row', 'Industrial Blvd', 'Central Ave', 'Dealer Way']
const YEAR_CODE: Record<number, string> = { 2016: 'G', 2017: 'H', 2018: 'J', 2019: 'K', 2020: 'L', 2021: 'M', 2022: 'N', 2023: 'P', 2024: 'R', 2025: 'S', 2026: 'T' }
const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
const HALO = /Type R|TRD Pro|Raptor|GT3|Turbo S|Z06|392|CS|Dark Horse|ZR2/

function vinCheckDigit(vin: string) {
  const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 }
  const w = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const c = vin[i]
    sum += (/\d/.test(c) ? Number(c) : map[c] ?? 0) * w[i]
  }
  const r = sum % 11
  return r === 10 ? 'X' : String(r)
}

export const SEED_VERSION = 3

export interface Store {
  listings: Listing[]
  dealers: Dealer[]
  dealerById: Map<string, Dealer>
  byVin: Map<string, Listing>
}

// Most generated listings are already sold: a steady market over the 150-day
// history window needs roughly 3.5 sales for every car still on the lot.
export function buildStore(count = 25000): Store {
  const rnd = mulberry32(20261117)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
  const between = (a: number, b: number) => a + rnd() * (b - a)
  const weighted = <T,>(arr: T[], weights: number[]) => {
    const total = weights.reduce((s, w) => s + w, 0)
    let r = rnd() * total
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i]
      if (r <= 0) return arr[i]
    }
    return arr[arr.length - 1]
  }

  // ---- dealers
  const dealers: Dealer[] = []
  let makeCursor = 0
  CITIES.forEach(([city, state, zip, lat, lng, size], ci) => {
    const mk = (name: string, type: Dealer['type'], group: string | null) => {
      dealers.push({
        id: `d${dealers.length + 1}`,
        name, group, type,
        address: `${Math.floor(between(100, 9800))} ${pick(STREETS)}`,
        city, state, zip,
        lat: lat + between(-0.16, 0.16), lng: lng + between(-0.2, 0.2),
        phone: `(${Math.floor(between(201, 989))}) 555-${String(Math.floor(between(100, 9999))).padStart(4, '0')}`,
        docFee: Math.round(between(85, 999) / 5) * 5,
      })
    }
    const nFranchise = 2 + size
    for (let i = 0; i < nFranchise; i++) {
      const make = MAKES[makeCursor++ % MAKES.length]
      const group = rnd() < 0.35 ? GROUPS[(ci + i) % GROUPS.length] : null
      mk(`${group ? group.split(' ')[0] : city} ${make}${group ? ` of ${city}` : ''}`, 'franchise', group)
    }
    for (let i = 0; i < Math.ceil(size / 2); i++) mk(`${pick(INDIE)} ${pick(INDIE_SUFFIX)}`, 'independent', null)
    if (ci % 14 === 0) mk(ci % 28 === 0 ? 'DriveDirect Online' : 'Carloop Online', 'online', ci % 28 === 0 ? 'DriveDirect' : 'Carloop')
  })
  const dealerById = new Map(dealers.map((d) => [d.id, d]))
  const franchiseByMake = new Map<string, Dealer[]>()
  for (const make of MAKES) franchiseByMake.set(make, dealers.filter((d) => d.type === 'franchise' && d.name.includes(` ${make}`)))
  const usedDealers = dealers
  const usedWeights = dealers.map((d) => (d.type === 'franchise' ? 1 : d.type === 'online' ? 4 : 1.4))

  // ---- listings
  const listings: Listing[] = []
  const seen = new Set<string>()
  const modelWeights = MODELS.map((m) => m.weight)

  for (let i = 0; i < count; i++) {
    const m: ModelDef = weighted(MODELS, modelWeights)
    const firstYear = m.gens[0].from
    const r = rnd()
    let condition: Listing['condition'] = r < 0.3 ? 'new' : r < 0.42 ? 'certified' : 'used'
    let year: number
    if (condition === 'new') year = rnd() < 0.72 ? 2026 : 2025
    else {
      const span = Math.max(1, 2025 - firstYear)
      const maxAge = condition === 'certified' ? Math.min(span, 5) : span
      year = 2025 - Math.floor(Math.pow(rnd(), 1.5) * (maxAge + 1))
      year = Math.max(firstYear, year)
    }
    const gen = m.gens.find((g) => year >= g.from && year <= g.to)
    if (!gen) { i--; continue }
    const age = 2026 - year
    const trim = weighted(m.trims, m.trims.map((_, ti) => (ti === 0 ? 3 : ti < 3 ? 4 : m.trims.length - ti + 0.6)))
    const pt = pick(m.pts)
    const drive = pick(pt.drives)
    const driveAdd = pt.drives.length > 1 && /AWD|4WD/.test(drive) ? 1700 : 0

    const pool = OPTION_POOL.filter((o) => !o.bodies || o.bodies.includes(m.body))
    const nOpt = Math.floor(Math.pow(rnd(), 1.4) * 5)
    const options: InstalledOption[] = []
    const features = new Set<string>()
    for (let k = 0; k < nOpt; k++) {
      const o = pick(pool)
      if (options.some((x) => x.code === o.code)) continue
      const scale = Math.min(1, m.base / 60000)
      options.push({ code: o.code, name: o.name, price: Math.round((o.price[0] + (o.price[1] - o.price[0]) * (0.3 * rnd() + 0.7 * scale)) / 5) * 5 })
      o.features.forEach((f) => features.add(f))
    }
    if (trim.add > m.base * 0.15) ['Leather Seats', 'Heated Seats', 'Blind Spot Monitor'].forEach((f) => features.add(f))
    if (/AWD|4WD/.test(drive) && m.body !== 'Sedan') features.add('Roof Rails')

    const yearScale = 1 - 0.022 * age
    const baseMsrp = Math.round(((m.base + trim.add + pt.add + driveAdd) * yearScale) / 5) * 5
    const msrp = baseMsrp + options.reduce((s, o) => s + o.price, 0) + 1395

    let miles: number
    if (condition === 'new') miles = Math.floor(between(3, 180))
    else miles = Math.max(900, Math.round((age + between(-0.3, 0.7)) * between(7000, 15500)))
    if (condition === 'certified') miles = Math.min(miles, 68000)

    const halo = HALO.test(trim.name) || m.make === 'Porsche'
    let price: number
    if (condition === 'new') price = msrp * between(halo ? 1.0 : 0.9, halo ? 1.12 : 1.03)
    else {
      const retain = Math.pow(halo ? 0.965 : pt.powertrain === 'BEV' ? 0.87 : 0.925, age) * (halo ? 1.02 : 0.94)
      const expected = age * 11500
      const mileAdj = 1 - ((miles - expected) / 10000) * 0.022
      price = msrp * retain * mileAdj * between(0.91, 1.09) * (condition === 'certified' ? 1.045 : 1)
    }
    price = Math.max(3500, Math.round(price / 10) * 10 - (rnd() < 0.5 ? 5 : 0))

    const dealer = condition === 'used' && rnd() > 0.5
      ? weighted(usedDealers, usedWeights)
      : pick(franchiseByMake.get(m.make)!.length ? franchiseByMake.get(m.make)! : dealers)

    const sold = rnd() < 0.78
    const soldDay = sold ? Math.floor(between(1, 150)) : null
    const duration = Math.floor(-Math.log(1 - rnd() * 0.985) * 42)
    const daysListed = (soldDay ?? 0) + duration

    const title = condition === 'new' ? 'Clean' : weighted(['Clean', 'Unknown', 'Salvage', 'Rebuilt', 'Lemon'], [34, 60, 2, 3, 1])
    if (title !== 'Clean' && title !== 'Unknown') { price = Math.round((price * 0.72) / 10) * 10; if (condition === 'certified') condition = 'used' }
    const prevUse = condition === 'new' ? 'None (new)' : weighted(['Personal', 'Lease', 'Rental', 'Fleet', 'Loaner', 'Not reported'], [44, 20, 8, 4, 2, 22])
    const availability = condition === 'new' ? weighted(['On lot', 'In transit', 'In production'], [74, 21, 5]) : 'On lot'

    // price history at the current seller, oldest first
    const noPrice = !sold && rnd() < 0.025
    const history: PricePoint[] = []
    if (!noPrice) {
      const end = soldDay ?? 0
      const nChanges = Math.min(5, Math.floor((daysListed - end) / between(16, 45)))
      const days: number[] = []
      for (let k = 0; k < nChanges; k++) days.push(Math.floor(between(end + 1, daysListed)))
      days.sort((a, b) => b - a)
      let p = price
      const rev: PricePoint[] = []
      for (let k = days.length - 1; k >= 0; k--) {
        rev.push({ day: days[k], price: p, miles })
        const delta = rnd() < 0.86 ? between(0.008, 0.035) : -between(0.005, 0.02)
        p = Math.round((p * (1 + delta)) / 10) * 10
      }
      rev.push({ day: daysListed, price: p, miles })
      history.push(...rev.reverse())
    }

    const previousSellers: PreviousSeller[] = []
    if (condition !== 'new' && rnd() < 0.38) {
      let cursor = daysListed + Math.floor(between(10, 60))
      let p = price
      const n = rnd() < 0.3 ? 2 : 1
      for (let k = 0; k < n; k++) {
        const d = pick(dealers)
        const len = Math.floor(between(12, 110))
        const last = Math.round((p * between(0.96, 1.12)) / 10) * 10
        const first = Math.round((last * between(1.0, 1.07)) / 10) * 10
        previousSellers.push({ dealer: d.name, city: d.city, state: d.state, fromDay: cursor + len, toDay: cursor, firstPrice: first, lastPrice: last, miles: Math.max(100, miles - Math.floor(between(200, 9000) * (k + 1))) })
        cursor += len + Math.floor(between(20, 400))
        p = first
      }
    }

    // VIN
    let vin = ''
    do {
      let body = WMI[m.make]
      for (let k = 0; k < 5; k++) body += VIN_CHARS[Math.floor(rnd() * VIN_CHARS.length)]
      const tail = YEAR_CODE[year] + VIN_CHARS[Math.floor(rnd() * 23)] + String(Math.floor(rnd() * 1e6)).padStart(6, '0')
      const draft = body + '0' + tail
      vin = body + vinCheckDigit(draft) + tail
    } while (seen.has(vin))
    seen.add(vin)

    const ext = weighted(EXT_COLORS, EXT_COLORS.map((c) => c.weight * (halo && !['White', 'Black', 'Gray', 'Silver'].includes(c.base) ? 3 : 1)))
    listings.push({
      vin,
      stock: `${dealer.name[0].toUpperCase()}${String(Math.floor(between(1000, 99999)))}${condition === 'new' ? '' : 'A'}`,
      status: sold ? 'sold' : 'active',
      condition,
      certProgram: condition === 'certified' ? `${m.make} Certified Pre-Owned` : null,
      year, make: m.make, model: m.model, generation: gen.name,
      trim: trim.name,
      version: pt.drives.length > 1 ? `${trim.name} ${drive}` : trim.name,
      body: m.body, seats: m.seats, doors: m.doors,
      fuel: pt.fuel, powertrain: pt.powertrain, engine: pt.engine, cylinders: pt.cyl,
      drivetrain: drive, transmission: pt.trans,
      extColor: ext.base, extColorName: pick(ext.names),
      intColor: weighted(INT_COLORS, INT_WEIGHTS),
      price: noPrice ? null : price,
      baseMsrp, msrp, miles, options,
      features: Array.from(features).sort(),
      title, prevUse, availability,
      plant: m.plant, country: m.country,
      dealerId: dealer.id,
      daysListed, soldDay, history, previousSellers,
    })
  }

  return { listings, dealers, dealerById, byVin: new Map(listings.map((l) => [l.vin, l])) }
}

export const KNOWN_ZIPS = CITIES.map(([city, state, zip, lat, lng]) => ({ city, state, zip, lat, lng }))
