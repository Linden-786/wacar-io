import { SearchParams, ScraperResult, CarListing } from './types'
import { scrapeCraigslist } from './craigslist'
import { scrapeEbayMotors } from './ebay-motors'

export type { CarListing, SearchParams, ScraperResult }

export async function scrapeAllSources(params: SearchParams): Promise<{
  listings: CarListing[]
  sources: { name: string; count: number; error?: string }[]
}> {
  // Run scrapers in parallel
  const results = await Promise.allSettled([
    scrapeCraigslist(params),
    scrapeEbayMotors(params),
  ])

  const allListings: CarListing[] = []
  const sources: { name: string; count: number; error?: string }[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { source, listings, error } = result.value
      allListings.push(...listings)
      sources.push({
        name: source,
        count: listings.length,
        error,
      })
    } else {
      // Handle rejected promise
      sources.push({
        name: 'Unknown',
        count: 0,
        error: result.reason?.message || 'Failed to fetch',
      })
    }
  }

  // Sort by price (lowest first), with null prices at the end
  allListings.sort((a, b) => {
    if (a.price === null && b.price === null) return 0
    if (a.price === null) return 1
    if (b.price === null) return -1
    return a.price - b.price
  })

  return { listings: allListings, sources }
}
