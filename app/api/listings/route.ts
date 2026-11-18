import { NextRequest, NextResponse } from 'next/server'
import { heatmap, search } from '@/lib/data/query'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const p = new URLSearchParams(req.nextUrl.searchParams)
  const offset = Math.max(0, Math.trunc(Number(p.get('offset'))) || 0)
  const limit = Math.max(1, Math.min(60, Math.trunc(Number(p.get('limit'))) || 24))
  const hidden = (p.get('hidden') ?? '').split(',').filter(Boolean).slice(0, 200)
  const vins = (p.get('vins') ?? '').split(',').filter(Boolean).slice(0, 100)
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
