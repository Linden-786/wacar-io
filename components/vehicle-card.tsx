'use client'

import Link from 'next/link'
import { EyeOff, Heart } from 'lucide-react'
import { VehiclePhoto } from '@/components/vehicle-photo'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFavorites, useHidden } from '@/lib/client-store'
import type { ListingView } from '@/lib/data/types'
import { ago, miles, money } from '@/lib/format'
import { cn } from '@/lib/utils'

export function conditionLabel(l: ListingView) {
  return l.condition === 'certified' ? 'Certified' : l.condition === 'new' ? 'New' : 'Used'
}

export function Tags({ l }: { l: ListingView }) {
  const tags: { text: string; variant: BadgeProps['variant'] }[] = [{ text: conditionLabel(l), variant: 'secondary' }]
  if (['Rental', 'Fleet', 'Loaner'].includes(l.prevUse)) tags.push({ text: l.prevUse, variant: 'warning' })
  if (!['Clean', 'Unknown'].includes(l.title)) tags.push({ text: `${l.title} title`, variant: 'warning' })
  if (l.availability !== 'On lot') tags.push({ text: l.availability, variant: 'outline' })
  if (l.discount != null && l.condition === 'new' && l.discount >= 5) tags.push({ text: `${l.discount.toFixed(0)}% under MSRP`, variant: 'success' })
  if (l.status === 'sold') tags.push({ text: `Sold ${ago(l.soldDay!)}`, variant: 'outline' })
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => <Badge key={t.text} variant={t.variant} className="rounded px-1.5 py-0 text-[11px] font-medium">{t.text}</Badge>)}
    </div>
  )
}

export function CardActions({ vin, className }: { vin: string; className?: string }) {
  const fav = useFavorites()
  const hidden = useHidden()
  const round = 'h-7 w-7 rounded-full bg-background/90 shadow-sm hover:bg-background'
  return (
    <div className={cn('flex gap-1', className)}>
      <Button type="button" variant="ghost" size="icon" className={round} aria-label={fav.has(vin) ? 'Remove favorite' : 'Favorite'} aria-pressed={fav.has(vin)} onClick={(e) => { e.preventDefault(); fav.toggle(vin) }}>
        <Heart className={cn('h-3.5 w-3.5', fav.has(vin) && 'fill-rose-500 text-rose-500')} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={round} aria-label={hidden.has(vin) ? 'Unhide' : 'Hide listing'} aria-pressed={hidden.has(vin)} onClick={(e) => { e.preventDefault(); hidden.toggle(vin) }}>
        <EyeOff className={cn('h-3.5 w-3.5', hidden.has(vin) && 'text-primary')} />
      </Button>
    </div>
  )
}

export function VehicleCard({ l, showDealer = true }: { l: ListingView; showDealer?: boolean }) {
  const drop = l.history.length > 1 ? l.history[l.history.length - 1].price - l.history[0].price : 0
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/search/listings/${l.vin}`} className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <VehiclePhoto photo={l.photo} body={l.body} color={l.extColor} alt={`${l.year} ${l.make} ${l.model}`} className={l.photo ? "aspect-[4/3] w-full" : "aspect-[212/92] w-full"} />
        <CardContent className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-semibold tabular-nums">{l.price == null ? 'No price yet' : money(l.price)}</span>
            {drop < 0 && <span className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">↓ {money(-drop)}</span>}
          </div>
          <div className="text-sm font-medium leading-snug">{l.year} {l.make} {l.model} <span className="text-muted-foreground">{l.version}</span></div>
          <Tags l={l} />
          <div className="mt-auto pt-1 text-xs text-muted-foreground">
            <div className="tabular-nums">{miles(l.miles)} · {l.extColor} · listed {ago(l.daysListed)}</div>
            <div className="truncate">{showDealer ? `${l.dealer.name} · ` : ''}{l.dealer.city}, {l.dealer.state}{l.distance != null && ` · ${l.distance} mi away`}</div>
          </div>
        </CardContent>
      </Link>
      <CardActions vin={l.vin} className="absolute right-2 top-2" />
    </Card>
  )
}
