import { ExternalLink, MapPin, Gauge, Calendar } from 'lucide-react'
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
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatMileage = (mileage: number | null) => {
    if (mileage === null) return null
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi'
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg group">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No image</span>
          </div>
        )}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: listing.sourceColor }}
        >
          {listing.source}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatPrice(listing.price)}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {listing.year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {listing.year}
              </span>
            )}
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{listing.location}</span>
              </span>
            )}
          </div>

          <Button asChild className="w-full" size="sm">
            <a href={listing.listingUrl} target="_blank" rel="noopener noreferrer">
              View Listing
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
