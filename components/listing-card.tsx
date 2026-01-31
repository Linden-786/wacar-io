import { ExternalLink, MapPin, Gauge, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CarListing } from '@/lib/scrapers/types'

interface ListingCardProps {
  listing: CarListing
}

export function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Contact for price'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatMileage = (mileage: number | null) => {
    if (mileage === null) return null
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi'
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg group">
      <div className="aspect-[16/10] relative bg-muted overflow-hidden">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.classList.add('flex', 'items-center', 'justify-center')
              const placeholder = document.createElement('div')
              placeholder.className = 'text-muted-foreground text-sm'
              placeholder.textContent = 'No image available'
              target.parentElement!.appendChild(placeholder)
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image available
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-background/90 backdrop-blur-sm">
            {listing.source}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold line-clamp-2 leading-tight" title={listing.title}>
              {listing.title}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
              {formatPrice(listing.price)}
            </span>
            {listing.year && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {listing.year}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.location && (
              <span className="flex items-center gap-1 truncate" title={listing.location}>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{listing.location}</span>
              </span>
            )}
          </div>

          <Button asChild className="w-full" size="sm">
            <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">
              View on {listing.source}
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
