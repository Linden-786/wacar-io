'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { compactMoney } from '@/lib/format'

export interface Pin { id: string; name: string; lat: number; lng: number; city: string; state: string; count: number; minPrice: number | null }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const icon = (pin: Pin) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div class="wacar-pin${pin.count > 12 ? ' wacar-pin-lg' : ''}">${pin.minPrice != null ? compactMoney(pin.minPrice) : pin.count}${pin.count > 1 && pin.minPrice != null ? `<i>${pin.count}</i>` : ''}</div>`,
  })

interface Props { pins: Pin[]; fitKey: string; bbox: string | null; onBox: (bbox: string) => void; onDealer: (name: string) => void }

// Plain Leaflet rather than a React wrapper: the map owns its DOM node and is
// torn down in the effect cleanup, so remounts (strict mode, suspense) are safe.
export default function ListingsMap({ pins, fitKey, bbox, onBox, onDealer }: Props) {
  const node = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  /** Moves made by code (fitting to results) must not be read as the user picking an area. */
  const quietUntil = useRef(0)
  const lastFit = useRef('')
  /** The box this map last reported, so an identical prop coming back is not re-applied. */
  const reported = useRef<string | null>(null)
  const handlers = useRef({ onBox, onDealer })
  handlers.current = { onBox, onDealer }

  useEffect(() => {
    if (!node.current) return
    const m = L.map(node.current, { center: [39.5, -96.5], zoom: 4, minZoom: 3, zoomSnap: 0.25, worldCopyJump: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    // Only drags and zooms count as choosing an area; resizes also fire "moveend".
    const report = () => {
      if (Date.now() < quietUntil.current) return
      const b = m.getBounds()
      const box = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(3)).join(',')
      reported.current = box
      handlers.current.onBox(box)
    }
    m.on('dragend', report)
    m.on('zoomend', report)
    map.current = m
    return () => { m.remove(); map.current = null; layer.current = null; lastFit.current = ''; reported.current = null }
  }, [])

  useEffect(() => {
    const m = map.current, group = layer.current
    if (!m || !group) return
    group.clearLayers()
    for (const p of pins) {
      L.marker([p.lat, p.lng], { icon: icon(p), title: p.name })
        .bindTooltip(`<strong>${esc(p.name)}</strong><br>${esc(p.city)}, ${esc(p.state)} · ${p.count} match${p.count === 1 ? '' : 'es'}`, { direction: 'top', offset: [0, -14] })
        .on('click', () => handlers.current.onDealer(p.name))
        .addTo(group)
    }
  }, [pins])

  useEffect(() => {
    const m = map.current
    if (!m) return
    const quietFit = (bounds: L.LatLngBoundsExpression, opts: L.FitBoundsOptions) => {
      quietUntil.current = Date.now() + 500
      m.invalidateSize({ animate: false })
      m.fitBounds(bounds, { animate: false, ...opts })
    }
    if (bbox) {
      // a box from the URL (reload, shared link) is shown on the map; one this map reported is already in view
      if (bbox !== reported.current) {
        const [w, s, e, n] = bbox.split(',').map(Number)
        if ([w, s, e, n].every(Number.isFinite)) quietFit([[s, w], [n, e]], {})
        reported.current = bbox
      }
      lastFit.current = ''
      return
    }
    reported.current = null
    if (!pins.length || lastFit.current === fitKey) return
    lastFit.current = fitKey
    // Alaska and Hawaii would shrink the lower 48 to a smear; frame them only when they are all there is.
    const mainland = pins.filter((p) => p.lng > -128 && p.lat < 50)
    quietFit(L.latLngBounds((mainland.length ? mainland : pins).map((p) => [p.lat, p.lng] as [number, number])), { padding: [30, 30], maxZoom: 10 })
  }, [pins, fitKey, bbox])

  return <div ref={node} className="h-full w-full" />
}
