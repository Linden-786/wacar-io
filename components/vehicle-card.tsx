'use client'

import Link from 'next/link'
import { EyeOff, Heart } from 'lucide-react'
import { CarArt } from '@/components/car-art'
import { useFavorites, useHidden } from '@/lib/client-store'
import type { ListingView } from '@/lib/data/types'
import { ago, miles, money } from '@/lib/format'
import { cn } from '@/lib/utils'

export function conditionLabel(l: ListingView) {
  return l.condition === 'certified' ? 'Certified' : l.condition === 'new' ? 'New' : 'Used'
}

export function Tags({ l }: { l: ListingView }) {
  const tags: { text: string; tone?: 'warn' | 'good' }[] = [{ text: conditionLabel(l) }]
  if (['Rental', 'Fleet', 'Loaner'].includes(l.prevUse)) tags.push({ text: l.prevUse, tone: 'warn' })
  if (!['Clean', 'Unknown'].includes(l.title)) tags.push({ text: `${l.title} title`, tone: 'warn' })
  if (l.availability !== 'On lot') tags.push({ text: l.availability })
  if (l.discount != null && l.condition === 'new' && l.discount >= 5) tags.push({ text: `${l.discount.toFixed(0)}% under MSRP`, tone: 'good' })
  if (l.status === 'sold') tags.push({ text: `Sold ${ago(l.soldDay!)}` })
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t.text}
          className={cn(
            'rounded px-1.5 py-0.5 text-[11px] font-medium',
            t.tone === 'warn' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : t.tone === 'good' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-secondary text-secondary-foreground',
          )}
        >
          {t.text}
        </span>
      ))}
    </div>
  )
}

export function CardActions({ vin, className }: { vin: string; className?: string }) {
  const fav = useFavorites()
  const hidden = useHidden()
  return (
    <div className={cn('flex gap-1', className)}>
      <button type="button" aria-label={fav.has(vin) ? 'Remove favorite' : 'Favorite'} aria-pressed={fav.has(vin)} onClick={(e) => { e.preventDefault(); fav.toggle(vin) }} className="grid h-7 w-7 place-items-center rounded-full bg-background/90 shadow-sm hover:bg-background">
        <Heart className={cn('h-3.5 w-3.5', fav.has(vin) && 'fill-rose-500 text-rose-500')} />
      </button>
      <button type="button" aria-label={hidden.has(vin) ? 'Unhide' : 'Hide listing'} aria-pressed={hidden.has(vin)} onClick={(e) => { e.preventDefault(); hidden.toggle(vin) }} className="grid h-7 w-7 place-items-center rounded-full bg-background/90 shadow-sm hover:bg-background">
        <EyeOff className={cn('h-3.5 w-3.5', hidden.has(vin) && 'text-primary')} />
      </button>
    </div>
  )
}

export function VehicleCard({ l, showDealer = true, compact }: { l: ListingView; showDealer?: boolean; compact?: boolean }) {
  const drop = l.history.length > 1 ? l.history[l.history.length - 1].price - l.history[0].price : 0
  return (
    <Link href={`/search/listings/${l.vin}`} className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      {!compact && <CarArt body={l.body} color={l.extColor} className="aspect-[212/92] w-full" />}
      <CardActions vin={l.vin} className={cn('absolute right-2 top-2', compact && 'opacity-0 group-hover:opacity-100')} />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-semibold tabular-nums">{l.price == null ? 'No price yet' : money(l.price)}</span>
          {drop < 0 && <span className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">↓ {money(-drop)}</span>}
        </div>
        <div className="text-sm font-medium leading-snug">{l.year} {l.make} {l.model} <span className="text-muted-foreground">{l.version}</span></div>
        <Tags l={l} />
        <div className="mt-auto pt-1 text-xs text-muted-foreground">
          <div className="tabular-nums">{miles(l.miles)} · {l.extColor} · listed {ago(l.daysListed)}</div>
          <div className="truncate">{showDealer ? l.dealer.name : `${l.dealer.city}, ${l.dealer.state}`}{showDealer && ` · ${l.dealer.city}, ${l.dealer.state}`}{l.distance != null && ` · ${l.distance} mi away`}</div>
        </div>
      </div>
    </Link>
  )
}
