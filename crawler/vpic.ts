// VIN decoding through NHTSA's free vPIC service. Dealers describe body style,
// drivetrain and fuel inconsistently; the VIN gives one consistent answer.
import { USER_AGENT } from './http'
import type { Decoded } from './types'

const BATCH = 50

export async function decodeVins(vins: string[], onProgress?: (done: number) => void): Promise<Map<string, Decoded>> {
  const out = new Map<string, Decoded>()
  for (let i = 0; i < vins.length; i += BATCH) {
    const chunk = vins.slice(i, i + BATCH)
    try {
      const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': USER_AGENT },
        body: new URLSearchParams({ format: 'json', data: chunk.join(';') }),
        signal: AbortSignal.timeout(60000),
      })
      if (res.ok) {
        const data = (await res.json()) as { Results?: Record<string, string>[] }
        for (const r of data.Results ?? []) {
          if (!r.VIN) continue
          out.set(r.VIN.toUpperCase(), {
            body: r.BodyClass ?? '', drive: r.DriveType ?? '', fuel: r.FuelTypePrimary ?? '', electrification: r.ElectrificationLevel ?? '',
            cylinders: Number(r.EngineCylinders) || 0, displacement: r.DisplacementL ? Number(r.DisplacementL).toFixed(1) : '',
            doors: Number(r.Doors) || 0, seats: Number(r.Seats) || 0,
            plantCity: r.PlantCity ?? '', plantState: r.PlantState ?? '', plantCountry: r.PlantCountry ?? '',
          })
        }
      }
    } catch { /* a failed batch is retried on the next crawl */ }
    onProgress?.(Math.min(vins.length, i + BATCH))
    await new Promise((r) => setTimeout(r, 400))
  }
  return out
}
