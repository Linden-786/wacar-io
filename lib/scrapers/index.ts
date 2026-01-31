import { CarListing, SearchParams, ScraperResult } from './types'
import { scrapeCraigslist } from './craigslist'
import { scrapeEbayMotors } from './ebay-motors'
import { getSampleListings } from './sample-data'
import { closeBrowser } from './browser'

export type { CarListing, SearchParams, ScraperResult }

export interface AggregatedResults {
  listings: CarListing[]
  sources: {
    name: string
    count: number
    error?: string
  }[]
  totalCount: number
  usingSampleData?: boolean
}

export async function scrapeAllSources(params: SearchParams): Promise<AggregatedResults> {
  let craigslistResult: ScraperResult = { listings: [] }
  let ebayResult: ScraperResult = { listings: [] }

  try {
    // Run scrapers sequentially to avoid browser conflicts
    craigslistResult = await scrapeCraigslist(params)
    ebayResult = await scrapeEbayMotors(params)
  } catch (error) {
    console.error('Scraping error:', error)
  } finally {
    // Clean up browser
    await closeBrowser().catch(() => {})
  }

  // Combine all listings
  const allListings: CarListing[] = [
    ...craigslistResult.listings,
    ...ebayResult.listings,
  ]

  // If no real results, use sample data for demo purposes
  const usingSampleData = allListings.length === 0
  if (usingSampleData) {
    const sampleListings = getSampleListings(params)
    allListings.push(...sampleListings)
  }

  // Sort by price (lowest first), with null prices at the end
  allListings.sort((a, b) => {
    if (a.price === null && b.price === null) return 0
    if (a.price === null) return 1
    if (b.price === null) return -1
    return a.price - b.price
  })

  return {
    listings: allListings,
    sources: [
      {
        name: 'Craigslist',
        count: craigslistResult.listings.length,
        error: craigslistResult.error,
      },
      {
        name: 'eBay Motors',
        count: ebayResult.listings.length,
        error: ebayResult.error,
      },
    ],
    totalCount: allListings.length,
    usingSampleData,
  }
}

// Re-export individual scrapers for testing
export { scrapeCraigslist } from './craigslist'
export { scrapeEbayMotors } from './ebay-motors'
