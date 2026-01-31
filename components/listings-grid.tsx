'use client'

import { useState, useEffect } from 'react'
import { ListingCard } from './listing-card'
import { SiteCard } from './site-card'
import { SiteGrid } from './site-grid'
import { CarListing } from '@/lib/scrapers/types'
import { generateAllUrls, SearchCriteria, carSites } from '@/lib/url-generators'
import { Loader2, AlertCircle, Car, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ListingsGridProps {
  searchParams: SearchCriteria
}

interface SearchResponse {
  success: boolean
  listings: CarListing[]
  sources: { name: string; count: number; error?: string }[]
  error?: string
}

export function ListingsGrid({ searchParams }: ListingsGridProps) {
  const [listings, setListings] = useState<CarListing[]>([])
  const [sources, setSources] = useState<{ name: string; count: number; error?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOtherSites, setShowOtherSites] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (searchParams.make) params.set('make', searchParams.make)
        if (searchParams.makeName) params.set('makeName', searchParams.makeName)
        if (searchParams.model) params.set('model', searchParams.model)
        if (searchParams.modelName) params.set('modelName', searchParams.modelName)
        if (searchParams.yearMin) params.set('yearMin', searchParams.yearMin.toString())
        if (searchParams.yearMax) params.set('yearMax', searchParams.yearMax.toString())
        if (searchParams.priceMin) params.set('priceMin', searchParams.priceMin.toString())
        if (searchParams.priceMax) params.set('priceMax', searchParams.priceMax.toString())
        if (searchParams.mileageMax) params.set('mileageMax', searchParams.mileageMax.toString())
        if (searchParams.zipCode) params.set('zipCode', searchParams.zipCode)
        if (searchParams.radius) params.set('radius', searchParams.radius.toString())
        if (searchParams.condition) params.set('condition', searchParams.condition)

        const response = await fetch(`/api/search?${params.toString()}`)
        const data: SearchResponse = await response.json()

        if (data.success) {
          setListings(data.listings)
          setSources(data.sources)
        } else {
          setError(data.error || 'Failed to fetch listings')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [searchParams])

  // Generate all site URLs
  const allSiteUrls = generateAllUrls(searchParams)

  // Get sources that failed (for showing as redirect links)
  const failedSources = sources.filter(s => s.error)
  const failedSiteUrls = allSiteUrls.filter(({ site }) =>
    failedSources.some(s => s.name.toLowerCase().includes(site.id.replace('-', ' ').split(' ')[0]))
  )

  // Other sites that weren't scraped
  const otherSiteUrls = allSiteUrls.filter(
    ({ site }) => !['craigslist', 'ebay-motors'].includes(site.id)
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Searching car listings...</p>
        <p className="text-sm text-muted-foreground">This may take a few seconds</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-destructive font-medium">Error loading listings</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Source summary */}
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <div
            key={source.name}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${
              source.error
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : source.count > 0
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {!source.error && source.count > 0 && <Check className="h-3.5 w-3.5" />}
            {source.name}: {source.count} {source.count === 1 ? 'listing' : 'listings'}
            {source.error && ' (redirect)'}
          </div>
        ))}
        <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
          Total: {listings.length} listings
        </div>
      </div>

      {/* Failed sources as redirect links */}
      {failedSiteUrls.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
            Some sites require direct access. Click to search:
          </p>
          <div className="flex flex-wrap gap-2">
            {failedSiteUrls.map(({ site, url }) => (
              <Button key={site.id} asChild variant="outline" size="sm">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {site.name}
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Listings grid */}
      {listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Car className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No listings found from scraped sources</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Try searching on individual sites below or adjust your search criteria.
          </p>
        </div>
      )}

      {/* Other sites section */}
      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Search More Sites
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOtherSites(!showOtherSites)}
          >
            {showOtherSites ? 'Hide' : 'Show'} ({otherSiteUrls.length} sites)
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Click to search on these sites with your criteria. Results will open in a new tab.
        </p>
        {showOtherSites && <SiteGrid sites={otherSiteUrls} />}
      </div>
    </div>
  )
}
