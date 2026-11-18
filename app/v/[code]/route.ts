import { NextRequest, NextResponse } from 'next/server'
import { fromShortCode } from '@/lib/data/query'

/** Short share links: /v/<code> forwards to the full listing page. */
export function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const l = fromShortCode(params.code)
  return NextResponse.redirect(new URL(l ? `/search/listings/${l.vin}` : '/search/listings', req.url))
}
