// Parser for dealer sites built on the Dealer.com platform. Their inventory
// listing pages are server-rendered and carry the page's vehicles as JSON
// ("WIS" state) plus schema.org markup for the dealership itself.
import { allowed, get } from './http'
import type { RawDealer, RawListing } from './types'

const PAGES = [
  { path: '/new-inventory/index.htm' },
  { path: '/used-inventory/index.htm' },
]
const MAX_PAGES_PER_LIST = 80

interface Attr { name: string; value?: string; normalizedValue?: string }
interface DdcVehicle {
  vin?: string; stockNumber?: string; condition?: string; certified?: boolean; year?: number; make?: string; model?: string; trim?: string
  link?: string; inventoryDate?: string; status?: string; offSite?: boolean; accountId?: string
  trackingAttributes?: Attr[]; attributes?: Attr[]
  trackingPricing?: Record<string, string>
  pricing?: { dprice?: { label?: string; value?: string; typeClass?: string; isFinalPrice?: boolean; isDiscount?: boolean }[] }
  images?: { uri?: string }[]
}

const money = (v: string | undefined | null) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n) : null }
const text = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\*/g, '').trim()

/** The embedded inventory state on a listing page. */
interface DdcAccount { name?: string; phone?: string; address?: { city?: string; firstLineAddress?: string; postalCode?: string; state?: string } }
function readState(html: string): { total: number; pageSize: number; vehicles: DdcVehicle[]; accounts: Record<string, DdcAccount> } | null {
  const at = html.indexOf('"WIS":{"pageInfo"')
  if (at < 0) return null
  // The object is embedded in a script; walk braces to find where it ends.
  const start = at + 6
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue }
    if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) {
      try {
        const obj = JSON.parse(html.slice(start, i + 1)) as { pageInfo?: { totalCount?: number; pageSize?: number }; inventory?: DdcVehicle[]; accounts?: Record<string, DdcAccount> }
        return { total: obj.pageInfo?.totalCount ?? 0, pageSize: obj.pageInfo?.pageSize ?? 0, vehicles: obj.inventory ?? [], accounts: obj.accounts ?? {} }
      } catch { return null }
    }
  }
  return null
}

function readDealers(html: string, host: string): Map<string, RawDealer> {
  const out = new Map<string, RawDealer>()
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data: unknown
    try { data = JSON.parse(m[1]) } catch { continue }
    const graph = (data as { '@graph'?: unknown[] })['@graph'] ?? [data]
    for (const node of graph as Record<string, unknown>[]) {
      if (node['@type'] !== 'AutoDealer') continue
      const a = (node.address ?? {}) as Record<string, string>
      const account = String(node['@id'] ?? '').split('#')[1] ?? host
      out.set(account, {
        id: `${host}#${account}`, host, name: String(node.name ?? host), phone: String(node.telephone ?? ''),
        address: a.streetAddress ?? '', city: a.addressLocality ?? '', state: a.addressRegion ?? '', zip: (a.postalCode ?? '').slice(0, 5),
      })
    }
  }
  return out
}

function toListing(v: DdcVehicle, host: string, dealers: Map<string, RawDealer>): RawListing | null {
  if (!v.vin || !/^[A-HJ-NPR-Z0-9]{17}$/.test(v.vin) || !v.make || !v.model || !v.year) return null
  const attrs = new Map<string, Attr>()
  for (const a of [...(v.attributes ?? []), ...(v.trackingAttributes ?? [])]) attrs.set(a.name, { ...attrs.get(a.name), ...a })
  const val = (k: string) => attrs.get(k)?.value
  const lines = v.pricing?.dprice ?? []
  const final = lines.find((l) => l.isFinalPrice)
  const listed = v.inventoryDate?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const dealer = dealers.get(v.accountId ?? '') ?? dealers.values().next().value
  if (!dealer) return null
  return {
    vin: v.vin,
    stock: v.stockNumber ?? '',
    condition: /new/i.test(v.condition ?? '') && !/pre/i.test(v.condition ?? '') ? 'new' : v.certified ? 'certified' : 'used',
    year: v.year, make: v.make.trim(), model: v.model.trim(), trim: (v.trim ?? '').trim(),
    price: money(final?.value) ?? money(v.trackingPricing?.internetPrice),
    msrp: money(v.trackingPricing?.msrp),
    miles: money(val('odometer')) ?? 0,
    extColorName: val('exteriorColor') ?? '', extColor: attrs.get('exteriorColor')?.normalizedValue ?? '',
    intColor: attrs.get('interiorColor')?.normalizedValue ?? val('interiorColor') ?? '',
    engine: val('engine') ?? '', transmission: val('transmission') ?? '', drivetrain: val('driveLine') ?? '',
    fuel: val('normalFuelType') ?? val('fuelType') ?? '',
    photo: v.images?.[0]?.uri ?? null,
    url: v.link ? new URL(v.link, `https://${host}`).toString() : `https://${host}`,
    listedOn: listed ? `${listed[3]}-${listed[1]}-${listed[2]}` : null,
    fees: lines.filter((l) => l.label && l.value).map((l) => ({ label: text(l.label!), amount: (l.isDiscount ? -1 : 1) * (money(l.value) ?? 0), total: !!l.isFinalPrice })),
    dealerId: dealer.id,
  }
}

export async function crawlDealerCom(host: string): Promise<{ dealers: RawDealer[]; listings: RawListing[]; requests: number; complete: boolean; note?: string }> {
  const dealers = new Map<string, RawDealer>()
  const seen = new Map<string, RawListing>()
  let requests = 0, complete = true, note: string | undefined
  for (const page of PAGES) {
    let total = Infinity
    for (let start = 0, n = 0; start < total && n < MAX_PAGES_PER_LIST; n++) {
      const url = `https://${host}${page.path}${start ? `?start=${start}` : ''}`
      if (!(await allowed(url))) { complete = false; note = `robots.txt disallows ${page.path}`; break }
      const res = await get(url)
      requests++
      if (res.status !== 200) { complete = false; note = `HTTP ${res.status} on ${page.path}`; break }
      const state = readState(res.body)
      if (!state) { complete = false; note = `no inventory data on ${page.path}`; break }
      for (const [k, d] of readDealers(res.body, host)) if (!dealers.has(k)) dealers.set(k, d)
      // Group sites list several rooftops; the page markup names them all after the site,
      // so take each rooftop's own name and address from the inventory state.
      for (const [k, a] of Object.entries(state.accounts)) {
        if (!a?.name) continue
        const d = dealers.get(k)
        dealers.set(k, {
          id: `${host}#${k}`, host, name: a.name.trim(), phone: d?.phone || a.phone || '',
          address: a.address?.firstLineAddress ?? d?.address ?? '', city: a.address?.city ?? d?.city ?? '',
          state: a.address?.state ?? d?.state ?? '', zip: (a.address?.postalCode ?? d?.zip ?? '').slice(0, 5),
        })
      }
      total = state.total
      if (!state.vehicles.length) break
      let fresh = 0
      for (const v of state.vehicles) {
        const l = toListing(v, host, dealers)
        if (l && !seen.has(l.vin)) { seen.set(l.vin, l); fresh++ }
      }
      // Pages overlap slightly (featured cars repeat); stop if a page adds nothing new.
      if (!fresh && start > 0) break
      start += state.pageSize || state.vehicles.length
    }
  }
  return { dealers: Array.from(dealers.values()), listings: Array.from(seen.values()), requests, complete, note }
}

export const isDealerCom = (homepageHtml: string) => /static\.dealer\.com|pictures\.dealer\.com|DDC\.WS\.state|ddc-site/i.test(homepageHtml)
