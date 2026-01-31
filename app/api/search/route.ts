import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllSources, SearchParams } from '@/lib/scrapers'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30 seconds for scraping

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const params: SearchParams = {
      make: searchParams.get('make') || undefined,
      makeName: searchParams.get('makeName') || undefined,
      model: searchParams.get('model') || undefined,
      modelName: searchParams.get('modelName') || undefined,
      yearMin: searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin')!) : undefined,
      yearMax: searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax')!) : undefined,
      priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
      mileageMax: searchParams.get('mileageMax') ? parseInt(searchParams.get('mileageMax')!) : undefined,
      zipCode: searchParams.get('zipCode') || undefined,
      radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined,
    }

    const results = await scrapeAllSources(params)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search listings', listings: [], sources: [], totalCount: 0 },
      { status: 500 }
    )
  }
}
