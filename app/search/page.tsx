import { Suspense } from 'react'
import Link from 'next/link'
import { SiteGrid } from '@/components/site-grid'
import { generateAllUrls, SearchCriteria } from '@/lib/url-generators'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search } from 'lucide-react'

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function SearchResultsContent({ criteria }: { criteria: SearchCriteria }) {
  const results = generateAllUrls(criteria)

  const hasFilters = criteria.makeName || criteria.yearMin || criteria.yearMax ||
                     criteria.priceMin || criteria.priceMax || criteria.mileageMax

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Search
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Search Results</h1>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {criteria.makeName && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {criteria.makeName}
                {criteria.modelName && ` ${criteria.modelName}`}
              </span>
            )}
            {(criteria.yearMin || criteria.yearMax) && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                {criteria.yearMin || 'Any'} - {criteria.yearMax || 'Any'} Year
              </span>
            )}
            {(criteria.priceMin || criteria.priceMax) && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                ${criteria.priceMin?.toLocaleString() || '0'} - ${criteria.priceMax?.toLocaleString() || 'Any'}
              </span>
            )}
            {criteria.mileageMax && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                Under {criteria.mileageMax.toLocaleString()} miles
              </span>
            )}
            {criteria.zipCode && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">
                Near {criteria.zipCode}
                {criteria.radius && ` (${criteria.radius} mi)`}
              </span>
            )}
            {criteria.condition && criteria.condition !== 'all' && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm capitalize">
                {criteria.condition}
              </span>
            )}
          </div>
        )}

        <p className="text-muted-foreground mt-4">
          Click on any site below to search with your criteria. Results will open in a new tab.
        </p>
      </div>

      <SiteGrid sites={results} />
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  const criteria: SearchCriteria = {
    make: params.make as string | undefined,
    makeName: params.makeName as string | undefined,
    model: params.model as string | undefined,
    modelName: params.modelName as string | undefined,
    yearMin: params.yearMin ? parseInt(params.yearMin as string) : undefined,
    yearMax: params.yearMax ? parseInt(params.yearMax as string) : undefined,
    priceMin: params.priceMin ? parseInt(params.priceMin as string) : undefined,
    priceMax: params.priceMax ? parseInt(params.priceMax as string) : undefined,
    mileageMax: params.mileageMax ? parseInt(params.mileageMax as string) : undefined,
    zipCode: params.zipCode as string | undefined,
    radius: params.radius ? parseInt(params.radius as string) : undefined,
    bodyType: params.bodyType as string | undefined,
    condition: params.condition as 'new' | 'used' | 'all' | undefined,
  }

  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <SearchResultsContent criteria={criteria} />
    </Suspense>
  )
}
