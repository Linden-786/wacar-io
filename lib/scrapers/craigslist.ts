import * as cheerio from 'cheerio'
import { CarListing, SearchParams, ScraperResult } from './types'

export async function scrapeCraigslist(params: SearchParams): Promise<ScraperResult> {
  try {
    const searchUrl = buildCraigslistUrl(params)

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      return { listings: [], error: `Craigslist returned ${response.status}` }
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const listings: CarListing[] = []

    // Craigslist search results structure
    $('li.cl-static-search-result, li.cl-search-result').each((_, element) => {
      try {
        const $el = $(element)

        // Get the link and title
        const $link = $el.find('a.cl-app-anchor, a.titlestring, a[href*="/cto/"]').first()
        const href = $link.attr('href') || ''
        const title = $link.text().trim() || $el.find('.title, .titlestring').text().trim()

        if (!href || !title) return

        // Get price
        const priceText = $el.find('.price, .priceinfo').text().trim()
        const priceMatch = priceText.match(/\$?([\d,]+)/)
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null

        // Get location
        const location = $el.find('.location, .meta').text().trim() || null

        // Get image
        let imageUrl = $el.find('img').attr('src') || null
        // Craigslist sometimes uses data-src for lazy loading
        if (!imageUrl) {
          imageUrl = $el.find('img').attr('data-src') || null
        }
        // Convert thumbnail to larger image if possible
        if (imageUrl && imageUrl.includes('50x50')) {
          imageUrl = imageUrl.replace('50x50', '600x450')
        }

        // Parse year, make, model from title
        const parsed = parseCarTitle(title)

        // Generate unique ID
        const id = `cl-${href.split('/').pop()?.replace('.html', '') || Date.now()}`

        listings.push({
          id,
          title,
          price,
          year: parsed.year,
          make: parsed.make || params.makeName || null,
          model: parsed.model || params.modelName || null,
          mileage: null, // Craigslist doesn't show mileage in search results
          location,
          imageUrl,
          listingUrl: href.startsWith('http') ? href : `https://craigslist.org${href}`,
          source: 'Craigslist',
          sourceColor: '#5b2d8e',
          postedDate: null,
        })
      } catch (e) {
        // Skip malformed listings
      }
    })

    return { listings: listings.slice(0, 20) } // Limit to 20 results
  } catch (error) {
    console.error('Craigslist scraper error:', error)
    return { listings: [], error: 'Failed to fetch Craigslist listings' }
  }
}

function buildCraigslistUrl(params: SearchParams): string {
  // Use sfc (San Francisco) as default region for demo, can be made dynamic with zipcode lookup
  const baseUrl = 'https://sfbay.craigslist.org/search/cta'
  const searchParams = new URLSearchParams()

  // Build search query from make and model
  const queryParts: string[] = []
  if (params.makeName) queryParts.push(params.makeName)
  if (params.modelName) queryParts.push(params.modelName)
  if (queryParts.length > 0) {
    searchParams.set('query', queryParts.join(' '))
  }

  if (params.yearMin) searchParams.set('min_auto_year', params.yearMin.toString())
  if (params.yearMax) searchParams.set('max_auto_year', params.yearMax.toString())
  if (params.priceMin) searchParams.set('min_price', params.priceMin.toString())
  if (params.priceMax) searchParams.set('max_price', params.priceMax.toString())
  if (params.mileageMax) searchParams.set('max_auto_miles', params.mileageMax.toString())
  if (params.zipCode) searchParams.set('postal', params.zipCode)
  if (params.radius) searchParams.set('search_distance', params.radius.toString())

  // Request results with images
  searchParams.set('hasPic', '1')

  return `${baseUrl}?${searchParams.toString()}`
}

function parseCarTitle(title: string): { year: number | null; make: string | null; model: string | null } {
  // Try to extract year (4-digit number between 1980 and current year + 1)
  const currentYear = new Date().getFullYear()
  const yearMatch = title.match(/\b(19[89]\d|20[0-2]\d)\b/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null

  // Common makes to look for
  const makes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Chevy', 'BMW', 'Mercedes', 'Audi',
    'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'VW', 'Jeep',
    'Dodge', 'Ram', 'GMC', 'Lexus', 'Acura', 'Infiniti', 'Porsche', 'Tesla',
    'Cadillac', 'Buick', 'Chrysler', 'Lincoln', 'Volvo', 'Land Rover', 'Jaguar'
  ]

  let make: string | null = null
  const titleLower = title.toLowerCase()
  for (const m of makes) {
    if (titleLower.includes(m.toLowerCase())) {
      make = m === 'Chevy' ? 'Chevrolet' : m === 'VW' ? 'Volkswagen' : m
      break
    }
  }

  return { year, make, model: null }
}
