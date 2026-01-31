import { CarListing, SearchParams, ScraperResult } from './types'
import { getPage } from './browser'

export async function scrapeCraigslist(params: SearchParams): Promise<ScraperResult> {
  let page = null

  try {
    const searchUrl = buildCraigslistUrl(params)
    console.log('Scraping Craigslist:', searchUrl)

    page = await getPage()
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for listings to load
    await page.waitForSelector('.cl-static-search-result, .cl-search-result, .result-row', { timeout: 10000 }).catch(() => null)

    // Extract listings using page.evaluate
    const listings = await page.evaluate((makeName, modelName) => {
      const results: any[] = []

      // Try multiple selectors for different Craigslist layouts
      const items = document.querySelectorAll('.cl-static-search-result, .cl-search-result, .result-row, li.result')

      items.forEach((item, index) => {
        if (index >= 20) return // Limit to 20

        try {
          // Get link and title
          const linkEl = item.querySelector('a.cl-app-anchor, a.titlestring, a.result-title, a[href*="/cto/"]') as HTMLAnchorElement
          if (!linkEl) return

          const href = linkEl.href || ''
          const title = linkEl.textContent?.trim() || ''
          if (!href || !title) return

          // Get price
          const priceEl = item.querySelector('.price, .result-price, .priceinfo')
          const priceText = priceEl?.textContent?.trim() || ''
          const priceMatch = priceText.match(/\$?([\d,]+)/)
          const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null

          // Get location
          const locEl = item.querySelector('.location, .result-hood, .meta')
          const location = locEl?.textContent?.trim().replace(/[()]/g, '') || null

          // Get image - try multiple approaches
          let imageUrl: string | null = null
          const imgEl = item.querySelector('img') as HTMLImageElement
          if (imgEl) {
            imageUrl = imgEl.src || imgEl.dataset.src || null
            // Skip data URIs (placeholder images)
            if (imageUrl && imageUrl.startsWith('data:')) {
              imageUrl = null
            }
            // Convert thumbnail to larger image
            if (imageUrl && imageUrl.includes('50x50')) {
              imageUrl = imageUrl.replace('50x50', '600x450')
            }
            // Ensure we get higher resolution images
            if (imageUrl && imageUrl.includes('300x300')) {
              imageUrl = imageUrl.replace('300x300', '600x450')
            }
          }

          // Parse year from title
          const yearMatch = title.match(/\b(19[89]\d|20[0-2]\d)\b/)
          const year = yearMatch ? parseInt(yearMatch[1]) : null

          // Generate ID from URL
          const idMatch = href.match(/\/(\d+)\.html/)
          const id = `cl-${idMatch ? idMatch[1] : Date.now() + index}`

          results.push({
            id,
            title,
            price,
            year,
            make: makeName || null,
            model: modelName || null,
            mileage: null,
            location,
            imageUrl,
            listingUrl: href,
            source: 'Craigslist',
            sourceColor: '#5b2d8e',
            postedDate: null,
          })
        } catch (e) {
          // Skip malformed items
        }
      })

      return results
    }, params.makeName, params.modelName)

    await page.close()

    console.log(`Craigslist: Found ${listings.length} listings`)
    return { listings: listings as CarListing[] }

  } catch (error) {
    console.error('Craigslist scraper error:', error)
    if (page) await page.close().catch(() => {})
    return { listings: [], error: 'Failed to fetch Craigslist listings' }
  }
}

function buildCraigslistUrl(params: SearchParams): string {
  // Use SF Bay Area as default region
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

  // Request results with images
  searchParams.set('hasPic', '1')

  return `${baseUrl}?${searchParams.toString()}`
}
