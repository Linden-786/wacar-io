'use client'

import { useState } from 'react'
import { CarArt } from '@/components/car-art'
import { cn } from '@/lib/utils'

/** The dealer's own photo of the car when there is one, otherwise a drawing of its body style and color. */
export function VehiclePhoto({ photo, body, color, alt, className, eager }: { photo?: string | null; body: string; color: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!photo || failed) return <CarArt body={body} color={color} className={className} />
  // Dealer.com's image host can resize; cards do not need the full-size photo
  const src = !eager && photo.startsWith('https://pictures.dealer.com/') && !photo.includes('?') ? `${photo}?impolicy=downsize&w=640` : photo
  return (
    // eslint-disable-next-line @next/next/no-img-element -- photos are served from many dealer hosts
    <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cn('bg-muted object-cover', className)} />
  )
}
