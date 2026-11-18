export const money = (n: number | null | undefined) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`)
export const signedMoney = (n: number) => `${n < 0 ? '−' : '+'}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`
export const num = (n: number | null | undefined) => (n == null ? '—' : Math.round(n).toLocaleString('en-US'))
export const miles = (n: number | null | undefined) => (n == null ? '—' : `${num(n)} mi`)
export const compactMoney = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 100000 || n % 1000 === 0 ? 0 : 1)}k` : `$${n}`)
export const compactNum = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))
export const pct = (n: number | null | undefined) => (n == null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}%`)

export function ago(days: number) {
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 60) return `${days} days ago`
  return `${Math.round(days / 30)} months ago`
}

/** Calendar date for "N days ago", formatted for display. */
export function dateOf(daysAgo: number, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('en-US', opts)
}
