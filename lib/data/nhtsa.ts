// Real safety data from NHTSA's public API (no key). Only make / model / year
// are sent. Failures degrade to "unavailable" rather than breaking the page.
export interface Recall { id: string; date: string; component: string; summary: string; remedy: string }
export interface Safety { recalls: Recall[] | null; complaints: number | null }

async function get(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) })
    // NHTSA answers 400 with a normal body when a vehicle simply has no records
    if (!res.ok && res.status !== 400) return null
    return (await res.json()) as { results?: Record<string, string>[]; count?: number; Count?: number }
  } catch {
    return null
  }
}

export async function safety(make: string, model: string, year: number): Promise<Safety> {
  const q = `make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
  const [r, c] = await Promise.all([
    get(`https://api.nhtsa.gov/recalls/recallsByVehicle?${q}`),
    get(`https://api.nhtsa.gov/complaints/complaintsByVehicle?${q}`),
  ])
  return {
    recalls: r
      ? (r.results ?? []).map((x) => ({ id: x.NHTSACampaignNumber, date: x.ReportReceivedDate, component: x.Component, summary: x.Summary, remedy: x.Remedy }))
      : null,
    complaints: c ? c.count ?? c.Count ?? c.results?.length ?? 0 : null,
  }
}
