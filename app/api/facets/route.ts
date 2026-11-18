import { NextRequest, NextResponse } from 'next/server'
import { facets } from '@/lib/data/query'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json(facets(new URLSearchParams(req.nextUrl.searchParams)))
}
