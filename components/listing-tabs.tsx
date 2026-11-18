'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, EyeOff, Flag, Heart, Link2 } from 'lucide-react'
import { useFavorites, useHidden } from '@/lib/client-store'
import type { ListingView, RangeStats } from '@/lib/data/types'
import { ago, dateOf, miles, money, signedMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ListingActions({ vin, shareUrl }: { vin: string; shareUrl: string }) {
  const fav = useFavorites()
  const hidden = useHidden()
  const [copied, setCopied] = useState(false)
  const [reported, setReported] = useState(false)
  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-secondary'
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={fav.has(vin)} onClick={() => fav.toggle(vin)} className={cn(btn, fav.has(vin) && 'border-rose-500/50 text-rose-600 dark:text-rose-400')}>
        <Heart className={cn('h-4 w-4', fav.has(vin) && 'fill-current')} /> {fav.has(vin) ? 'Favorited' : 'Favorite'}
      </button>
      <button type="button" aria-pressed={hidden.has(vin)} onClick={() => hidden.toggle(vin)} className={cn(btn, hidden.has(vin) && 'bg-secondary')}>
        <EyeOff className="h-4 w-4" /> {hidden.has(vin) ? 'Hidden' : 'Hide'}
      </button>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {}) }}
        className={btn}
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />} {copied ? 'Link copied' : 'Copy short link'}
      </button>
      <button type="button" disabled={reported} onClick={() => setReported(true)} className={cn(btn, reported && 'text-muted-foreground')}>
        <Flag className="h-4 w-4" /> {reported ? 'Thanks, noted' : 'Report sold or wrong'}
      </button>
    </div>
  )
}

function History({ l }: { l: ListingView }) {
  const points = l.history
  const lowest = points.length ? Math.min(...points.map((p) => p.price)) : null
  const feeLines = l.price == null ? [] : [
    ['Advertised price', l.price],
    ['Documentation fee', l.dealer.docFee],
    ['Total before tax and registration', l.price + l.dealer.docFee],
  ] as [string, number][]
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold">At {l.dealer.name}</h3>
        {!points.length ? <p className="mt-2 text-sm text-muted-foreground">This seller has not published a price yet.</p> : (
          <ol className="mt-3 space-y-0 border-l pl-4">
            {[...points].reverse().map((p, i, arr) => {
              const prev = arr[i + 1]
              const delta = prev ? p.price - prev.price : 0
              return (
                <li key={p.day} className="relative pb-4 last:pb-0">
                  <span className={cn('absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background', i === 0 ? 'bg-primary' : 'bg-muted-foreground/50')} />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold tabular-nums">{money(p.price)}</span>
                    {prev && <span className={cn('text-sm tabular-nums', delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>{signedMoney(delta)}</span>}
                    {p.price === lowest && points.length > 1 && <span className="rounded bg-emerald-500/15 px-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Lowest</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{prev ? 'Price change' : 'First listed'} · {dateOf(p.day)} ({ago(p.day)}) · {miles(p.miles)}</div>
                </li>
              )
            })}
          </ol>
        )}
        {l.status === 'sold' && <p className="mt-3 text-sm">Marked sold {ago(l.soldDay!)}. Sold status is inferred from the listing disappearing, so treat it as an estimate.</p>}
      </div>
      <div className="space-y-6">
        {feeLines.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Dealer pricing details</h3>
            <dl className="mt-2 divide-y rounded-lg border text-sm">
              {feeLines.map(([k, v], i) => (
                <div key={k} className={cn('flex justify-between px-3 py-2', i === feeLines.length - 1 && 'bg-muted/40 font-semibold')}><dt>{k}</dt><dd className="tabular-nums">{money(v)}</dd></div>
              ))}
            </dl>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">Previous sellers</h3>
          {!l.previousSellers.length ? <p className="mt-2 text-sm text-muted-foreground">{l.condition === 'new' ? 'New vehicle: no earlier sellers.' : 'No earlier listings on record for this VIN.'}</p> : (
            <ul className="mt-2 space-y-2">
              {l.previousSellers.map((s) => (
                <li key={s.fromDay} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{s.dealer} <span className="font-normal text-muted-foreground">· {s.city}, {s.state}</span></div>
                  <div className="text-xs text-muted-foreground">{dateOf(s.fromDay)} – {dateOf(s.toDay)} · {miles(s.miles)}</div>
                  <div className="mt-1 tabular-nums">{money(s.firstPrice)} → {money(s.lastPrice)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const TOGGLES = [['trim', 'Same trim'], ['year', 'Within 1 model year'], ['miles', 'Within 15k miles'], ['local', 'Within 250 miles'], ['sold', 'Compare to sold']] as const

function Leaderboard({ l }: { l: ListingView }) {
  const [on, setOn] = useState<Record<string, boolean>>({ trim: true, year: true, miles: false, local: false, sold: false })
  const [data, setData] = useState<{ rank: number; total: number; items: ListingView[]; stats: RangeStats | null } | null>(null)
  const qs = TOGGLES.map(([k]) => `${k}=${on[k] ? 1 : 0}`).join('&')
  useEffect(() => {
    const ctl = new AbortController()
    fetch(`/api/listing/${l.vin}?${qs}`, { signal: ctl.signal }).then((r) => r.json()).then(setData).catch(() => {})
    return () => ctl.abort()
  }, [l.vin, qs])
  const me = data?.items.findIndex((x) => x.vin === l.vin) ?? -1
  const window = data ? data.items.slice(Math.max(0, Math.min(me - 4, data.items.length - 12)), Math.max(12, me + 8)) : []
  const start = data ? data.items.indexOf(window[0]) : 0
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {TOGGLES.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={on[k]} onClick={() => setOn((cur) => ({ ...cur, [k]: !cur[k] }))} className={cn('rounded-full border px-3 py-1 text-sm', on[k] && 'border-primary bg-primary/10 font-medium')}>{label}</button>
        ))}
      </div>
      {!data ? <div className="mt-4 h-40 animate-pulse rounded-lg bg-muted/40" /> : l.price == null ? <p className="mt-4 text-sm text-muted-foreground">This listing has no price, so it cannot be ranked.</p> : (
        <>
          <p className="mt-4 text-lg font-semibold">
            Ranked #{data.rank} of {data.total} by price
            {data.stats && <span className="ml-2 text-sm font-normal text-muted-foreground">median {money(data.stats.median)} · this one is {signedMoney(l.price - data.stats.median)} vs. median</span>}
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr>{['#', 'Vehicle', 'Price', 'vs. this', 'Miles', 'vs. this', 'Location'].map((h, i) => <th key={i} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {window.map((x, i) => {
                  const mine = x.vin === l.vin
                  return (
                    <tr key={x.vin} className={cn('border-t', mine && 'bg-primary/10 font-medium')}>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{start + i + 1}</td>
                      <td className="px-3 py-2">{mine ? 'This listing' : <Link className="hover:underline" href={`/search/listings/${x.vin}`}>{x.year} {x.version} · {x.extColor}</Link>}</td>
                      <td className="px-3 py-2 tabular-nums">{money(x.price)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{mine ? '—' : signedMoney(x.price! - l.price!)}</td>
                      <td className="px-3 py-2 tabular-nums">{miles(x.miles)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{mine ? '—' : `${x.miles - l.miles < 0 ? '−' : '+'}${Math.abs(x.miles - l.miles).toLocaleString('en-US')}`}</td>
                      <td className="px-3 py-2 text-muted-foreground">{x.dealer.city}, {x.dealer.state}{!mine && x.distance != null && ` · ${x.distance} mi`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const FIELDS = [
  ['price', 'Vehicle price on the quote'],
  ['doc', 'Documentation fee'],
  ['addons', 'Dealer add-ons (protection packages, etching, nitrogen…)'],
  ['warranty', 'Extended warranty / service contract'],
  ['other', 'Other dealer fees'],
  ['trade', 'Trade-in credit'],
  ['tax', 'Sales tax rate (%)'],
] as const

function DealCheck({ l, median, typicalDoc }: { l: ListingView; median: number | null; typicalDoc: number }) {
  const [v, setV] = useState<Record<string, string>>({ price: l.price ? String(l.price) : '', doc: String(l.dealer.docFee), tax: '6.5' })
  const n = (k: string) => Number((v[k] ?? '').replace(/[^0-9.]/g, '')) || 0
  const taxable = Math.max(0, n('price') + n('doc') + n('addons') + n('other') - n('trade'))
  const tax = (taxable * n('tax')) / 100
  const total = taxable + n('warranty') + tax
  const notes: { tone: 'good' | 'warn' | 'info'; text: string }[] = []
  if (n('price') && l.price) {
    const d = n('price') - l.price
    notes.push(d > 0 ? { tone: 'warn', text: `The quoted price is ${money(d)} above the advertised price of ${money(l.price)}. Ask why.` } : d < 0 ? { tone: 'good', text: `The quoted price is ${money(-d)} below the advertised price.` } : { tone: 'info', text: 'The quoted price matches the advertised price.' })
  }
  if (n('price') && median) {
    const d = n('price') - median
    notes.push({ tone: d > median * 0.03 ? 'warn' : d < -median * 0.03 ? 'good' : 'info', text: `Comparable ${l.year} ${l.model} ${l.trim} listings have a median asking price of ${money(median)}; this quote is ${signedMoney(d)} against that.` })
  }
  if (n('doc')) notes.push(n('doc') > typicalDoc * 1.4 ? { tone: 'warn', text: `A ${money(n('doc'))} doc fee is well above the ${money(typicalDoc)} typical for dealers in ${l.dealer.state}. Doc fees are rarely waived, but the vehicle price can be lowered to offset them.` } : { tone: 'info', text: `The doc fee is in line with the ${money(typicalDoc)} typical for ${l.dealer.state}. It pays for paperwork and is charged to every buyer.` })
  if (n('addons')) notes.push({ tone: 'warn', text: `${money(n('addons'))} in dealer add-ons. These are installed or sold by the dealer, not the factory, and are almost always negotiable or removable.` })
  if (n('warranty')) notes.push({ tone: 'info', text: `${money(n('warranty'))} for a service contract is optional. You can decline it or buy one later, often for less.` })
  if (n('other')) notes.push({ tone: 'warn', text: `${money(n('other'))} in other fees. Ask for each one by name; government fees (title, registration) are legitimate, "prep" or "market adjustment" fees are negotiable.` })
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">Enter the numbers from a dealer’s quote to see the out-the-door total and which lines deserve a question.</p>
        <div className="mt-3 space-y-2">
          {FIELDS.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm">
              <span>{label}</span>
              <input inputMode="decimal" value={v[k] ?? ''} onChange={(e) => setV((cur) => ({ ...cur, [k]: e.target.value }))} placeholder="0" className="h-9 w-32 shrink-0 rounded border bg-background px-2 text-right tabular-nums" />
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">Estimated out-the-door total</div>
          <div className="text-3xl font-bold tabular-nums">{money(total)}</div>
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">{money(taxable)} taxable + {money(tax)} tax{n('warranty') ? ` + ${money(n('warranty'))} contract` : ''}. Registration and title fees vary by state and are not included.</div>
        </div>
        <ul className="mt-3 space-y-2">
          {notes.map((note, i) => (
            <li key={i} className={cn('rounded-lg border-l-4 bg-muted/40 px-3 py-2 text-sm', note.tone === 'warn' ? 'border-amber-500' : note.tone === 'good' ? 'border-emerald-500' : 'border-border')}>{note.text}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ListingTabs({ l, median, typicalDoc }: { l: ListingView; median: number | null; typicalDoc: number }) {
  const [tab, setTab] = useState<'history' | 'leaderboard' | 'deal'>('history')
  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b">
        {([['history', 'History'], ['leaderboard', 'Leaderboard'], ['deal', 'Deal check']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={cn('-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground', tab === k && 'border-primary text-foreground')}>{label}</button>
        ))}
      </div>
      <div className="pt-5">
        {tab === 'history' && <History l={l} />}
        {tab === 'leaderboard' && <Leaderboard l={l} />}
        {tab === 'deal' && <DealCheck l={l} median={median} typicalDoc={typicalDoc} />}
      </div>
    </div>
  )
}
