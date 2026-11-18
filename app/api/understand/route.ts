import { NextRequest, NextResponse } from 'next/server'
import { understand } from '@/lib/data/understand'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({ interpretations: understand(req.nextUrl.searchParams.get('q') ?? '') })
}
