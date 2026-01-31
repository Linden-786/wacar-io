import { CarListing, SearchParams, ScraperResult } from './types'
import { getPage } from './browser'

export async function scrapeEbayMotors(params: SearchParams): Promise<ScraperResult> {
  let page = null

  try {
    const searchUrl = buildEbayUrl(params)
    console.log('Scraping eBay Motors:', searchUrl)

    page = await getPage()
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for listings to load
    await page.waitForSelector('.s-item', { timeout: 10000 }).catch(() => null)

    // Scroll to load lazy images
    await page.evaluate(() => {
      window.scrollBy(0, 1000)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Extract listings
    const listings = await page.evaluate((makeName, modelName) => {
      const results: any[] = []

      const items = document.querySelectorAll('.s-item')

      items.forEach((item, index) => {
        if (index >= 20) return // Limit to 20

        try {
          // Skip placeholder items
          if (item.classList.contains('s-item__pl-on-bottom')) return

          // Get title and link
          const linkEl = item.querySelector('.s-item__link') as HTMLAnchorElement
          const titleEl = item.querySelector('.s-item__title')

          if (!linkEl || !titleEl) return

          const href = linkEl.href || ''
          const title = titleEl.textContent?.trim() || ''

          // Skip non-car items
          if (!href || !title || title.toLowerCase().includes('shop on ebay')) return

          // Get price
          const priceEl = item.querySelector('.s-item__price')
          const priceText = priceEl?.textContent?.trim() || ''
          const priceMatch = priceText.match(/\$?([\d,]+)/)
          const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null

          // Skip if price too low (likely parts)
          if (price && price < 1000) return

          // Get image
          let imageUrl: string | null = null
          const imgEl = item.querySelector('.s-item__image-wrapper img, .s-item__image img') as HTMLImageElement
          if (imgEl) {
            // Get the actual src, not placeholder
            imageUrl = imgEl.src || imgEl.dataset.src || null
            // Skip placeholder/loading images
            if (imageUrl && (imageUrl.includes('gif') || imageUrl.includes('data:'))) {
              imageUrl = imgEl.dataset.src || null
            }
          }

          // Get location
          const locEl = item.querySelector('.s-item__location, .s-item__itemLocation')
          const location = locEl?.textContent?.replace('from ', '').trim() || null

          // Get mileage from subtitle if available
          const subtitleEl = item.querySelector('.s-item__subtitle')
          const subtitleText = subtitleEl?.textContent || ''
          const mileageMatch = subtitleText.match(/([\d,]+)\s*(?:miles|mi)/i)
          const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null

          // Parse year from title
          const yearMatch = title.match(/\b(19[89]\d|20[0-2]\d)\b/)
          const year = yearMatch ? parseInt(yearMatch[1]) : null

          // Extract item ID from URL
          const itemIdMatch = href.match(/\/itm\/(\d+)/)
          const id = `ebay-${itemIdMatch ? itemIdMatch[1] : Date.now() + index}`

          results.push({
            id,
            title: title.replace(/\s*-\s*New Listing\s*$/i, '').trim(),
            price,
            year,
            make: makeName || null,
            model: modelName || null,
            mileage,
            location,
            imageUrl,
            listingUrl: href.split('?')[0],
            source: 'eBay Motors',
            sourceColor: '#e53238',
            postedDate: null,
          })
        } catch (e) {
          // Skip malformed items
        }
      })

      return results
    }, params.makeName, params.modelName)

    await page.close()

    console.log(`eBay Motors: Found ${listings.length} listings`)
    return { listings: listings as CarListing[] }

  } catch (error) {
    console.error('eBay Motors scraper error:', error)
    if (page) await page.close().catch(() => {})
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
    searchParams.set('LH_PrefLoc', '99')
  }

  // Sort by newly listed
  searchParams.set('_sop', '10')

  // Only used cars
  searchParams.set('LH_ItemCondition', '3000')

  return `${baseUrl}?${searchParams.toString()}`
}
