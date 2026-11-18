import { NextRequest, NextResponse } from 'next/server'
import { heatmap, search } from '@/lib/data/query'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const p = new URLSearchParams(req.nextUrl.searchParams)
  const offset = Number(p.get('offset')) || 0
  const limit = Math.min(60, Number(p.get('limit')) || 24)
  const hidden = (p.get('hidden') ?? '').split(',').filter(Boolean)
  const vins = (p.get('vins') ?? '').split(',').filter(Boolean)
  ;['offset', 'limit', 'hidden', 'vins'].forEach((k) => p.delete(k))
  if (vins.length) {
    // favorites / hidden lists: fetch specific VINs regardless of status
    const { getStore, toView } = await import('@/lib/data/query')
    const items = vins.map((v) => getStore().byVin.get(v)).filter(Boolean).map((l) => toView(l!, null))
    return NextResponse.json({ total: items.length, items })
  }
  const result = search(p, { offset, limit, hidden })
  return NextResponse.json({ ...result, heat: offset === 0 ? heatmap(p) : undefined })
}
