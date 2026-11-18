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
  const programmatic = useRef(false)
  const lastFit = useRef('')
  const handlers = useRef({ onBox, onDealer })
  handlers.current = { onBox, onDealer }

  useEffect(() => {
    if (!node.current) return
    const m = L.map(node.current, { center: [39.5, -96.5], zoom: 4, minZoom: 3, worldCopyJump: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    m.on('moveend', () => {
      if (programmatic.current) return
      const b = m.getBounds()
      handlers.current.onBox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(3)).join(','))
    })
    map.current = m
    return () => { m.remove(); map.current = null; layer.current = null; lastFit.current = '' }
  }, [])

  useEffect(() => {
    const m = map.current, group = layer.current
    if (!m || !group) return
    group.clearLayers()
    for (const p of pins) {
      L.marker([p.lat, p.lng], { icon: icon(p), title: p.name })
        .bindTooltip(`<strong>${esc(p.name)}</strong><br>${esc(p.city)}, ${p.state} · ${p.count} match${p.count === 1 ? '' : 'es'}`, { direction: 'top', offset: [0, -14] })
        .on('click', () => handlers.current.onDealer(p.name))
        .addTo(group)
    }
    // Fit to the result set whenever the filters (not the map box) change.
    if (bbox || !pins.length || lastFit.current === fitKey) return
    lastFit.current = fitKey
    programmatic.current = true
    // Alaska and Hawaii would shrink the lower 48 to a smear; frame them only when they are all there is.
    const mainland = pins.filter((p) => p.lng > -128 && p.lat < 50)
    m.fitBounds(L.latLngBounds((mainland.length ? mainland : pins).map((p) => [p.lat, p.lng] as [number, number])), { padding: [30, 30], maxZoom: 10, animate: false })
    const t = setTimeout(() => { programmatic.current = false }, 300)
    return () => clearTimeout(t)
  }, [pins, fitKey, bbox])

  return <div ref={node} className="h-full w-full" />
}
