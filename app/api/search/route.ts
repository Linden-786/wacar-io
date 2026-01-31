import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllSources, SearchParams } from '@/lib/scrapers'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30 seconds for scraping

export async function GET(request: NextRequest) {
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
    condition: (searchParams.get('condition') as 'new' | 'used' | 'all') || undefined,
  }

  try {
    const { listings, sources } = await scrapeAllSources(params)

    return NextResponse.json({
      success: true,
      listings,
      sources,
      meta: {
        total: listings.length,
        params,
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        listings: [],
        sources: [],
      },
      { status: 500 }
    )
  }
}
