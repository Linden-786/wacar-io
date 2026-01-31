import * as cheerio from 'cheerio'
import { CarListing, SearchParams, ScraperResult } from './types'

export async function scrapeEbayMotors(params: SearchParams): Promise<ScraperResult> {
  try {
    const searchUrl = buildEbayUrl(params)

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      return { listings: [], error: `eBay Motors returned ${response.status}` }
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const listings: CarListing[] = []

    // eBay search results - use combined selector
    const selector = '.srp-results .s-item, .b-list__items_nofooter li.s-item, ul.srp-results li.s-item, .srp-river-results .s-item'

    $(selector).each((_, element) => {
      try {
        const $el = $(element)

        // Skip placeholder items
        if ($el.hasClass('s-item__pl-on-bottom')) return

        // Get title and link
        const $titleLink = $el.find('.s-item__link, a.s-item__link').first()
        const href = $titleLink.attr('href') || ''
        const title = $el.find('.s-item__title, .s-item__title span').first().text().trim()

        // Skip "Shop on eBay" type entries
        if (!href || !title || title.toLowerCase().includes('shop on ebay')) return

        // Get price
        const priceText = $el.find('.s-item__price').first().text().trim()
        const priceMatch = priceText.match(/\$?([\d,]+)/)
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null

        // Skip if price seems unreasonable for a car (likely parts)
        if (price && price < 500) return

        // Get image
        let imageUrl = $el.find('.s-item__image-wrapper img').attr('src') || null
        if (!imageUrl) {
          imageUrl = $el.find('.s-item__image img').attr('src') || null
        }
        // Skip placeholder images
        if (imageUrl && imageUrl.includes('gif')) {
          imageUrl = $el.find('.s-item__image-wrapper img').attr('data-src') || imageUrl
        }

        // Get location
        const location = $el.find('.s-item__location').text().replace('from ', '').trim() || null

        // Get mileage if shown
        const detailsText = $el.find('.s-item__subtitle').text()
        const mileageMatch = detailsText.match(/([\d,]+)\s*(?:miles|mi)/i)
        const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null

        // Parse year from title
        const parsed = parseCarTitle(title)

        // Extract item ID from URL
        const itemIdMatch = href.match(/\/itm\/(\d+)/)
        const id = `ebay-${itemIdMatch ? itemIdMatch[1] : Date.now()}`

        listings.push({
          id,
          title: cleanTitle(title),
          price,
          year: parsed.year,
          make: parsed.make || params.makeName || null,
          model: parsed.model || params.modelName || null,
          mileage,
          location,
          imageUrl,
          listingUrl: href.split('?')[0], // Clean URL
          source: 'eBay Motors',
          sourceColor: '#e53238',
          postedDate: null,
        })
      } catch (e) {
        // Skip malformed listings
      }
    })

    return { listings: listings.slice(0, 20) } // Limit to 20 results
  } catch (error) {
    console.error('eBay Motors scraper error:', error)
    return { listings: [], error: 'Failed to fetch eBay Motors listings' }
  }
}

function buildEbayUrl(params: SearchParams): string {
  const baseUrl = 'https://www.ebay.com/sch/Cars-Trucks/6001/i.html'
  const searchParams = new URLSearchParams()

  // Build search keywords
  const keywords: string[] = []
  if (params.makeName) keywords.push(params.makeName)
  if (params.modelName) keywords.push(params.modelName)
  if (keywords.length > 0) {
    searchParams.set('_nkw', keywords.join(' '))
  }

  // Price filters
  if (params.priceMin) searchParams.set('_udlo', params.priceMin.toString())
  if (params.priceMax) searchParams.set('_udhi', params.priceMax.toString())

  // Location
  if (params.zipCode) {
    searchParams.set('_stpos', params.zipCode)
    searchParams.set('_sadis', (params.radius || 100).toString())
    searchParams.set('LH_PrefLoc', '99') // Items within radius
  }

  // Year filter - eBay uses Model Year aspect
  if (params.yearMin) {
    searchParams.set('Model%20Year', `${params.yearMin}-${params.yearMax || new Date().getFullYear() + 1}`)
  }

  // Sort by best match
  searchParams.set('_sop', '12')

  // Only show items with images
  searchParams.set('LH_ItemCondition', '3000') // Used vehicles

  return `${baseUrl}?${searchParams.toString()}`
}

function parseCarTitle(title: string): { year: number | null; make: string | null; model: string | null } {
  const currentYear = new Date().getFullYear()
  const yearMatch = title.match(/\b(19[89]\d|20[0-2]\d)\b/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null

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

function cleanTitle(title: string): string {
  // Remove common eBay suffixes
  return title
    .replace(/\s*-\s*New Listing\s*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim()
}
