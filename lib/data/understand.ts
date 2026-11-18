// Rule-based plain-language search: "awd hybrid suv under 40k near 43017"
// becomes a filter query. No model calls; just the catalog and some patterns.
import { EXT_COLORS, INT_COLORS } from './catalog'
import { encodeValue, summarize } from './filters'
import { getStore, locateZip, vocabulary } from './query'

export interface Interpretation { label: string; query: string; kind: 'search' | 'listing' | 'dealer' }

const MAKE_ALIASES: Record<string, string> = { chevy: 'Chevrolet', vw: 'Volkswagen', bimmer: 'BMW', beemer: 'BMW', subie: 'Subaru', mercedes: 'Mercedes-Benz', benz: 'Mercedes-Benz', merc: 'Mercedes-Benz', lambo: 'Lamborghini', landrover: 'Land Rover', rolls: 'Rolls-Royce', alfa: 'Alfa Romeo', aston: 'Aston Martin', caddy: 'Cadillac' }
const BODY: Record<string, string> = { suv: 'SUV', suvs: 'SUV', crossover: 'SUV', sedan: 'Sedan', sedans: 'Sedan', truck: 'Pickup', trucks: 'Pickup', pickup: 'Pickup', coupe: 'Coupe', wagon: 'Wagon', minivan: 'Minivan', minivans: 'Minivan', van: 'Van', vans: 'Van', hatchback: 'Hatchback', hatch: 'Hatchback', convertible: 'Convertible', roadster: 'Convertible' }
const DRIVE: Record<string, string> = { awd: 'AWD', '4wd': '4WD', '4x4': '4WD', fwd: 'FWD', rwd: 'RWD' }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
const num = (n: string, k?: string) => Math.round(Number(n.replace(/,/g, '')) * (k ? 1000 : 1))

export function understand(input: string): Interpretation[] {
  const store = getStore()
  const MODELS = vocabulary()
  const raw = input.trim()
  if (!raw) return []
  const out: Interpretation[] = []

  // exact VIN or stock number
  const upper = raw.toUpperCase().replace(/\s+/g, '')
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(upper)) {
    const hit = store.byVin.get(upper)
    if (hit) return [{ kind: 'listing', label: `${hit.year} ${hit.make} ${hit.model} ${hit.trim} · VIN ${hit.vin}`, query: hit.vin }]
  }
  const byStock = store.listings.find((l) => l.stock.toUpperCase() === upper)
  if (byStock) out.push({ kind: 'listing', label: `Stock #${byStock.stock}: ${byStock.year} ${byStock.make} ${byStock.model}`, query: byStock.vin })

  let s = ' ' + raw.toLowerCase().replace(/[,]/g, '') + ' '
  const p = new URLSearchParams()
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(re)
    if (m) { fn(m); s = s.replace(m[0], ' ') }
    return !!m
  }

  take(/within (\d{1,3}) ?(?:mi|miles)\b/, (m) => p.set('radius', m[1]))
  // a ZIP needs a cue word; bare five-digit numbers are handled after prices and mileage
  take(/\b(?:near|in|around|from|of) (\d{5})\b/, (m) => { p.set('zip', m[1]); if (!p.get('radius')) p.set('radius', '100') })
  take(/(?:under|below|less than|max|<) ?(\d[\d.]*) ?(k)? ?(?:mi|miles)\b/, (m) => p.set('miles_max', String(num(m[1], m[2]))))
  take(/(?:over|above|more than|min|>) ?(\d[\d.]*) ?(k)? ?(?:mi|miles)\b/, (m) => p.set('miles_min', String(num(m[1], m[2]))))
  take(/\$?(\d[\d.]*) ?(k)? ?(?:-|to) ?\$?(\d[\d.]*) ?(k)\b/, (m) => { p.set('price_min', String(num(m[1], m[2] ?? m[4]))); p.set('price_max', String(num(m[3], m[4]))) })
  take(/\$?(\d{4,6}) ?(?:-|to) ?\$?(\d{4,6})\b/, (m) => { if (Number(m[1]) > 2100 || Number(m[2]) > 2100) { p.set('price_min', m[1]); p.set('price_max', m[2]) } else { p.set('year_min', m[1]); p.set('year_max', m[2]) } })
  take(/(?:under|below|less than|max|<) ?\$?(\d[\d.]*) ?(k)?\b/, (m) => p.set('price_max', String(num(m[1], m[2] ?? (Number(m[1]) < 1000 ? 'k' : undefined)))))
  take(/(?:over|above|more than|min|>) ?\$?(\d[\d.]*) ?(k)?\b/, (m) => p.set('price_min', String(num(m[1], m[2] ?? (Number(m[1]) < 1000 ? 'k' : undefined)))))
  take(/\b(20[12]\d) ?(?:-|to) ?(20[12]\d)\b/, (m) => { p.set('year_min', m[1]); p.set('year_max', m[2]) })
  take(/\b(20[12]\d)\b/, (m) => p.set('year', m[1]))
  if (!p.get('zip')) {
    const bare = s.match(/\b(\d{5})\b/)
    if (bare && locateZip(bare[1])) { p.set('zip', bare[1]); p.set('radius', p.get('radius') ?? '100'); s = s.replace(bare[0], ' ') }
  }

  const conds: string[] = []
  if (take(/\b(certified pre-?owned|certified|cpo)\b/, () => {})) conds.push('Certified')
  if (take(/\b(used|pre-?owned)\b/, () => {})) conds.push('Used')
  if (take(/\bnew\b(?! (?:york|jersey|orleans|mexico|hampshire|haven))/, () => {})) conds.push('New')
  if (conds.length) p.set('condition', conds.join(','))

  take(/\b(plug-?in(?: hybrid)?|phev)\b/, () => p.set('fuel', 'Plug-in Hybrid'))
  take(/\b(hybrid)\b/, () => p.set('fuel', 'Hybrid'))
  take(/\b(electric|ev|bev)\b/, () => p.set('fuel', 'Electric'))
  take(/\b(diesel)\b/, () => p.set('fuel', 'Diesel'))
  take(/\b(manual|stick(?: shift)?|6mt)\b/, () => p.set('transmission', 'Manual'))
  take(/\b(v8|v6)\b/, (m) => p.set('cylinders', m[1][1]))
  take(/\b(sold)\b/, () => p.set('status', 'sold'))
  for (const c of INT_COLORS) take(new RegExp(`\\b${c.toLowerCase()} (?:interior|leather|seats)\\b`), () => p.set('int_color', c))
  for (const c of EXT_COLORS) take(new RegExp(`\\b${c.base.toLowerCase()}\\b`), () => p.set('ext_color', c.base))
  if (take(/\bgrey\b/, () => {})) p.set('ext_color', 'Gray')

  // vehicle: models first (longest names first), then makes, then trims / generations
  let words = s.split(/\s+/).filter(Boolean)
  const eat = (phrase: string) => {
    const target = norm(phrase)
    if (!target) return false
    for (let n = 4; n >= 1; n--) for (let i = 0; i + n <= words.length; i++) {
      if (norm(words.slice(i, i + n).join('')) === target) { words.splice(i, n); return true }
    }
    return false
  }
  // make first, so short or numeric model names ("IS", "Z", "1500") only match alongside their make
  let make: string | undefined
  for (const m of Array.from(new Set(MODELS.map((x) => x.make))).sort((a, b) => b.length - a.length)) if (!make && eat(m)) make = m
  for (const [alias, name] of Object.entries(MAKE_ALIASES)) if (!make && eat(alias)) make = name
  const ambiguous = (name: string) => name !== '911' && (/^[A-Za-z]{1,2}$/.test(name) || /^\d+$/.test(name))
  const model = MODELS.filter((m) => (make ? m.make === make : !ambiguous(m.model))).sort((a, b) => b.model.length - a.model.length)
    .find((m) => eat(m.model) || (m.model === 'MX-5 Miata' && (eat('miata') || eat('mx5'))) || (m.model === 'Golf GTI' && eat('gti')) || (m.model === 'Silverado 1500' && eat('silverado')) || (m.model === 'Mustang Mach-E' && eat('mache')) || (m.model === 'Sierra 1500' && eat('sierra')) || (m.model === 'Corvette' && eat('vette')))
  make ??= model?.make
  if (make) p.set('make', make)
  let trimHit: string | undefined
  if (model) {
    p.set('model', model.model)
    const trim = [...model.trims].sort((a, b) => b.name.length - a.name.length).find((t) => t.name !== 'Base' && eat(t.name))
    if (trim) { p.set('trim', trim.name); trimHit = trim.name }
  }
  // generation codes such as "g80", "c8", "jl", "xa50"
  const gens = MODELS.filter((m) => !make || m.make === make).filter((m) => !model || m === model)
  outer: for (const m of gens) for (const gen of m.gens) {
    const codes = [gen.name.match(/\(([^)]+)\)/)?.[1], /^[A-Za-z0-9.]{2,6}$/.test(gen.name) ? gen.name : null].filter(Boolean) as string[]
    for (const code of codes) if (eat(code)) { p.set('make', m.make); p.set('model', m.model); p.set('generation', gen.name); break outer }
  }
  for (const w of [...words]) {
    if (BODY[w] && !model) { p.set('body', BODY[w]); eat(w) }
    else if (DRIVE[w]) { p.set('drivetrain', DRIVE[w]); eat(w) }
  }

  const has = Array.from(p.keys()).length > 0
  if (has) {
    out.push({ kind: 'search', label: label(p), query: p.toString() })
    if (trimHit) { const q = new URLSearchParams(p); q.delete('trim'); out.push({ kind: 'search', label: label(q) + ' (any trim)', query: q.toString() }) }
    if (p.get('zip')) { const q = new URLSearchParams(p); q.delete('zip'); q.delete('radius'); out.push({ kind: 'search', label: label(q) + ' nationwide', query: q.toString() }) }
    if (!p.get('condition') && p.get('model')) { const q = new URLSearchParams(p); q.set('condition', 'Used,Certified'); out.push({ kind: 'search', label: label(q), query: q.toString() }) }
  }

  // dealers and places by name
  const needle = norm(raw)
  if (needle.length >= 3) {
    const names = new Set<string>()
    for (const d of store.dealers) {
      if (names.size >= 3) break
      if (norm(d.name).includes(needle) && !names.has(d.name)) { names.add(d.name); out.push({ kind: 'dealer', label: `Dealer: ${d.name} (${d.city}, ${d.state})`, query: new URLSearchParams({ dealer: encodeValue(d.name) }).toString() }) }
    }
    const city = store.dealers.find((d) => norm(d.city) === needle)
    if (city) out.push({ kind: 'search', label: `Cars near ${city.city}, ${city.state}`, query: new URLSearchParams({ zip: city.zip, radius: '50' }).toString() })
  }
  return out.slice(0, 5)
}

function label(p: URLSearchParams) {
  const bits = [summarize(p)]
  const extra = ['fuel', 'drivetrain', 'transmission', 'ext_color', 'generation'].map((k) => p.get(k)).filter(Boolean)
  if (extra.length) bits.push(`· ${extra.join(', ')}`)
  if (p.get('miles_max')) bits.push(`· under ${Number(p.get('miles_max')).toLocaleString('en-US')} mi`)
  if (p.get('status') === 'sold') bits.push('· sold')
  return bits.join(' ')
}
