import * as cheerio from 'cheerio'
import { CarListing, SearchParams, ScraperResult } from './types'

// Major Craigslist cities to search
const CRAIGSLIST_CITIES = [
  'newyork',
  'losangeles',
  'chicago',
  'houston',
  'phoenix',
  'sfbay',
  'dallas',
  'miami',
  'atlanta',
  'seattle',
]

export async function scrapeCraigslist(params: SearchParams): Promise<ScraperResult> {
  const listings: CarListing[] = []

  try {
    const searchTerms: string[] = []
    if (params.makeName) searchTerms.push(params.makeName)
    if (params.modelName) searchTerms.push(params.modelName)

    const urlParams = new URLSearchParams()
    if (searchTerms.length > 0) {
      urlParams.set('query', searchTerms.join(' '))
    }
    if (params.yearMin) urlParams.set('min_auto_year', params.yearMin.toString())
    if (params.yearMax) urlParams.set('max_auto_year', params.yearMax.toString())
    if (params.priceMin) urlParams.set('min_price', params.priceMin.toString())
    if (params.priceMax) urlParams.set('max_price', params.priceMax.toString())
    if (params.mileageMax) urlParams.set('max_auto_miles', params.mileageMax.toString())

    // Search top 3 cities in parallel for speed
    const citiesToSearch = CRAIGSLIST_CITIES.slice(0, 3)

    const cityResults = await Promise.allSettled(
      citiesToSearch.map(async (city) => {
        const url = `https://${city}.craigslist.org/search/cta?${urlParams.toString()}`

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        })

        if (!response.ok) {
          throw new Error(`Craigslist ${city} returned ${response.status}`)
        }

        const html = await response.text()
        return { city, html }
      })
    )

    for (const result of cityResults) {
      if (result.status !== 'fulfilled') continue

      const { city, html } = result.value
      const $ = cheerio.load(html)

      // Craigslist static search results (no-JS fallback that we can parse)
      $('li.cl-static-search-result').each((_, element) => {
        try {
          const $el = $(element)
          const $link = $el.find('a').first()
          let href = $link.attr('href') || ''

          const title = $el.find('.title').text().trim() ||
                        $el.attr('title') || ''

          const priceText = $el.find('.price').text().trim()
          const price = priceText ? parseInt(priceText.replace(/[$,]/g, '')) : null

          const location = $el.find('.location').text().trim() || city

          // Parse year from title
          const yearMatch = title.match(/\b(19|20)\d{2}\b/)
          const year = yearMatch ? parseInt(yearMatch[0]) : null

          // Parse mileage from title
          const mileageMatch = title.match(/(\d{1,3}[,\d]*)\s*(?:mi|miles|k\s*mi)/i)
          let mileage = null
          if (mileageMatch) {
            const mileageStr = mileageMatch[1].replace(/,/g, '')
            mileage = parseInt(mileageStr)
            if (mileageMatch[0].toLowerCase().includes('k')) {
              mileage *= 1000
            }
          }

          if (title && href) {
            // Ensure full URL
            if (!href.startsWith('http')) {
              href = `https://${city}.craigslist.org${href}`
            }

            const listingId = href.split('/').pop()?.replace('.html', '') || Math.random().toString(36)

            // Avoid duplicates by checking ID
            if (!listings.some(l => l.id === `craigslist-${listingId}`)) {
              listings.push({
                id: `craigslist-${listingId}`,
                source: 'Craigslist',
                sourceUrl: href,
                title,
                price: (price !== null && !isNaN(price) && price > 0) ? price : null,
                year,
                make: params.makeName || null,
                model: params.modelName || null,
                mileage,
                location,
                imageUrl: null, // Craigslist static doesn't include images
              })
            }
          }
        } catch (e) {
          // Skip malformed listing
        }
      })
    }

    // Limit to 20 results
    return { source: 'Craigslist', listings: listings.slice(0, 20) }
  } catch (error) {
    return {
      source: 'Craigslist',
      listings: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
