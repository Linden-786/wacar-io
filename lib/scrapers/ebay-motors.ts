import * as cheerio from 'cheerio'
import { CarListing, SearchParams, ScraperResult } from './types'

export async function scrapeEbayMotors(params: SearchParams): Promise<ScraperResult> {
  const listings: CarListing[] = []

  try {
    const keywords: string[] = []
    if (params.makeName) keywords.push(params.makeName)
    if (params.modelName) keywords.push(params.modelName)

    const urlParams = new URLSearchParams()
    if (keywords.length > 0) {
      urlParams.set('_nkw', keywords.join(' '))
    }

    urlParams.set('_sacat', '6001') // Cars & Trucks category
    urlParams.set('LH_ItemCondition', '3000') // Used
    urlParams.set('_sop', '12') // Sort by newly listed

    if (params.priceMin) urlParams.set('_udlo', params.priceMin.toString())
    if (params.priceMax) urlParams.set('_udhi', params.priceMax.toString())
    if (params.zipCode) urlParams.set('_stpos', params.zipCode)
    if (params.radius) urlParams.set('_sadis', params.radius.toString())

    const url = `https://www.ebay.com/sch/Cars-Trucks/6001/i.html?${urlParams.toString()}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'manual', // Don't follow redirects to detect challenges
    })

    // eBay often redirects to CAPTCHA challenge
    if (response.status === 307 || response.status === 302) {
      return {
        source: 'eBay Motors',
        listings: [],
        error: 'eBay requires verification - use redirect link',
      }
    }

    if (!response.ok) {
      throw new Error(`eBay returned ${response.status}`)
    }

    const html = await response.text()

    // Check if we hit a challenge page
    if (html.includes('challenge') || html.includes('captcha') || html.includes('splashui')) {
      return {
        source: 'eBay Motors',
        listings: [],
        error: 'eBay requires verification - use redirect link',
      }
    }

    const $ = cheerio.load(html)

    // eBay search result items
    $('.s-item').each((_, element) => {
      try {
        const $el = $(element)
        const $link = $el.find('.s-item__link').first()
        const href = $link.attr('href') || ''

        if (!href || href.includes('pulsar')) return

        const title = $el.find('.s-item__title').text().trim()
        if (!title || title === 'Shop on eBay') return

        const priceText = $el.find('.s-item__price').text().trim()
        const price = priceText ? parseInt(priceText.replace(/[$,]/g, '').split(' ')[0]) : null

        const location = $el.find('.s-item__location, .s-item__itemLocation').text().trim().replace(/^from\s*/i, '')

        const imageUrl = $el.find('.s-item__image-img').attr('src') ||
                         $el.find('.s-item__image-img').attr('data-src') || null

        const yearMatch = title.match(/\b(19|20)\d{2}\b/)
        const year = yearMatch ? parseInt(yearMatch[0]) : null

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
          listings.push({
            id: `ebay-${href.split('/itm/')[1]?.split('?')[0] || Math.random().toString(36)}`,
            source: 'eBay Motors',
            sourceUrl: href.split('?')[0],
            title: title.replace('New Listing', '').trim(),
            price: (price !== null && !isNaN(price)) ? price : null,
            year,
            make: params.makeName || null,
            model: params.modelName || null,
            mileage,
            location: location || null,
            imageUrl,
          })
        }
      } catch (e) {
        // Skip malformed listing
      }
    })

    return { source: 'eBay Motors', listings: listings.slice(0, 20) }
  } catch (error) {
    return {
      source: 'eBay Motors',
      listings: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
