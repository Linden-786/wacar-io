import { NextRequest, NextResponse } from 'next/server'
import { comparables, getStore } from '@/lib/data/query'

export const dynamic = 'force-dynamic'

/** Leaderboard data for one listing; toggles arrive as query flags. */
export async function GET(req: NextRequest, { params }: { params: { vin: string } }) {
  const l = getStore().byVin.get(params.vin.toUpperCase())
  if (!l) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const q = req.nextUrl.searchParams
  const on = (k: string) => q.get(k) === '1'
  return NextResponse.json(comparables(l, { trim: on('trim'), miles: on('miles'), year: on('year'), local: on('local'), sold: on('sold') }))
}
