import { NextRequest, NextResponse } from 'next/server'
import { mapPins } from '@/lib/data/query'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({ pins: mapPins(new URLSearchParams(req.nextUrl.searchParams)) })
}
