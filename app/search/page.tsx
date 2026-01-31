'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ListingCard } from '@/components/listing-card'
import { SiteCard } from '@/components/site-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, Loader2, AlertCircle, Info } from 'lucide-react'
import { CarListing } from '@/lib/scrapers/types'
import { carSites } from '@/lib/url-generators'

interface AggregatedResults {
  listings: CarListing[]
  sources: {
    name: string
    count: number
    error?: string
  }[]
  totalCount: number
  usingSampleData?: boolean
}

function SearchResults() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState<AggregatedResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Parse search params
  const makeName = searchParams.get('makeName')
  const modelName = searchParams.get('modelName')
  const yearMin = searchParams.get('yearMin')
  const yearMax = searchParams.get('yearMax')
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const mileageMax = searchParams.get('mileageMax')
  const zipCode = searchParams.get('zipCode')
  const radius = searchParams.get('radius')

  const hasFilters = makeName || yearMin || yearMax || priceMin || priceMax || mileageMax

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const apiParams = new URLSearchParams()
        searchParams.forEach((value, key) => {
          apiParams.set(key, value)
        })

        const response = await fetch(`/api/search?${apiParams.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch results')
        }

        const data: AggregatedResults = await response.json()
        setResults(data)
      } catch (err) {
        setError('Failed to load search results. Please try again.')
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchParams])

  // Generate URLs for other sites (non-scraped)
  const otherSitesUrls = carSites
    .filter(site => !['craigslist', 'ebay-motors'].includes(site.id))
    .map(site => ({
      site,
      url: site.generateUrl({
        makeName: makeName || undefined,
        modelName: modelName || undefined,
        yearMin: yearMin ? parseInt(yearMin) : undefined,
        yearMax: yearMax ? parseInt(yearMax) : undefined,
        priceMin: priceMin ? parseInt(priceMin) : undefined,
        priceMax: priceMax ? parseInt(priceMax) : undefined,
        mileageMax: mileageMax ? parseInt(mileageMax) : undefined,
        zipCode: zipCode || undefined,
        radius: radius ? parseInt(radius) : undefined,
      }),
    }))

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Search
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {makeName ? `${makeName}${modelName ? ` ${modelName}` : ''} Listings` : 'Search Results'}
          </h1>
        </div>

        {/* Filter tags */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {makeName && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {makeName}
                {modelName && ` ${modelName}`}
              </span>
            )}
            {(yearMin || yearMax) && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                {yearMin || 'Any'} - {yearMax || 'Any'} Year
              </span>
            )}
            {(priceMin || priceMax) && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                ${parseInt(priceMin || '0').toLocaleString()} - ${priceMax ? parseInt(priceMax).toLocaleString() : 'Any'}
              </span>
            )}
            {mileageMax && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                Under {parseInt(mileageMax).toLocaleString()} miles
              </span>
            )}
            {zipCode && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                Near {zipCode}
                {radius && ` (${radius} mi)`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Searching Craigslist and eBay Motors...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && (
        <>
          {/* Source summary */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b">
            <span className="text-lg font-semibold">
              {results.totalCount} {results.totalCount === 1 ? 'listing' : 'listings'} found
            </span>
            <div className="flex flex-wrap gap-2">
              {results.sources.map((source) => (
                <span
                  key={source.name}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    source.error
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {source.name}: {source.error ? 'Error' : `${source.count}`}
                </span>
              ))}
            </div>
          </div>

          {/* Sample data notice */}
          {results.usingSampleData && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Showing sample listings for demonstration
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Live scraping is limited due to anti-bot protections. Check the sites below for real listings.
                </p>
              </div>
            </div>
          )}

          {/* Listings Grid */}
          {results.listings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No listings found matching your criteria.
              </p>
              <p className="text-sm text-muted-foreground">
                Try broadening your search or check the other sites below.
              </p>
            </div>
          )}

          {/* Other Sites Section */}
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Search on other sites</h2>
            <p className="text-muted-foreground mb-6">
              Click to search the same criteria on these sites (opens in new tab)
            </p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {otherSitesUrls.map(({ site, url }) => (
                <SiteCard key={site.id} site={site} url={url} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  )
}
