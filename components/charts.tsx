// Small dependency-free SVG charts. They render on the server and inherit
// theme colors through currentColor / CSS variables.
import { compactMoney, compactNum } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

const W = 560, H = 200, PAD = { l: 46, r: 12, t: 12, b: 24 }

function scale(values: number[], pad = 0.08) {
  let lo = Math.min(...values), hi = Math.max(...values)
  if (lo === hi) { lo -= 1; hi += 1 }
  const span = hi - lo
  return { lo: lo - span * pad, hi: hi + span * pad }
}

function Frame({ children, ticks, fmt, lo, hi, title }: { children: React.ReactNode; ticks?: number; fmt: (n: number) => string; lo: number; hi: number; title: string }) {
  const n = ticks ?? 4
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
      {Array.from({ length: n + 1 }, (_, i) => {
        const y = PAD.t + ((H - PAD.t - PAD.b) * i) / n
        const v = hi - ((hi - lo) * i) / n
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="stroke-border" strokeWidth="1" />
            <text x={PAD.l - 6} y={y + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">{fmt(v)}</text>
          </g>
        )
      })}
      {children}
    </svg>
  )
}

export function LineChart({ points, kind = 'money', title }: { points: { label: string; value: number | null }[]; kind?: 'money' | 'count'; title: string }) {
  const fmt = kind === 'money' ? compactMoney : compactNum
  const pts = points.filter((p): p is { label: string; value: number } => p.value != null)
  if (pts.length < 2) return <p className="py-8 text-center text-sm text-muted-foreground">Not enough data to chart yet.</p>
  const { lo, hi } = scale(pts.map((p) => p.value))
  const x = (i: number) => PAD.l + ((W - PAD.l - PAD.r) * i) / (pts.length - 1)
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - lo) / (hi - lo))
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const every = Math.ceil(pts.length / 6)
  return (
    <Frame fmt={(n) => fmt(Math.round(n))} lo={lo} hi={hi} title={title}>
      <path d={`${d} L${x(pts.length - 1)} ${H - PAD.b} L${x(0)} ${H - PAD.b} Z`} className="fill-primary/10" />
      <path d={d} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="7" fill="transparent"><title>{`${p.label}: ${kind === 'money' ? '$' : ''}${Math.round(p.value).toLocaleString('en-US')}`}</title></circle>
          {((i % every === 0 && pts.length - 1 - i >= every / 2) || i === pts.length - 1) && <text x={x(i)} y={H - 7} textAnchor={i === pts.length - 1 ? 'end' : 'middle'} className="fill-muted-foreground text-[10px]">{p.label}</text>}
        </g>
      ))}
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].value)} r="3.5" className="fill-primary" />
    </Frame>
  )
}

export function BarChart({ bars, title }: { bars: { label: string; value: number }[]; title: string }) {
  if (!bars.length) return null
  const hi = Math.max(1, ...bars.map((b) => b.value)) * 1.1
  const bw = (W - PAD.l - PAD.r) / bars.length
  const every = Math.ceil(bars.length / 7)
  return (
    <Frame fmt={(n) => compactNum(Math.round(n))} lo={0} hi={hi} title={title}>
      {bars.map((b, i) => {
        const h = ((H - PAD.t - PAD.b) * b.value) / hi
        return (
          <g key={i}>
            <rect x={PAD.l + i * bw + 1.5} y={H - PAD.b - h} width={Math.max(1, bw - 3)} height={h} rx="2" className="fill-primary/80"><title>{`${b.label}: ${b.value}`}</title></rect>
            {i % every === 0 && <text x={PAD.l + i * bw + bw / 2} y={H - 7} textAnchor="middle" className="fill-muted-foreground text-[10px]">{b.label}</text>}
          </g>
        )
      })}
    </Frame>
  )
}

/** Price vs. mileage for a market, with one listing called out. */
export function Scatter({ points, highlight, title }: { points: { miles: number; price: number }[]; highlight?: { miles: number; price: number }; title: string }) {
  const all = highlight ? [...points, highlight] : points
  if (all.length < 3) return <p className="py-8 text-center text-sm text-muted-foreground">Not enough comparable listings to plot.</p>
  const ys = scale(all.map((p) => p.price)), xs = scale(all.map((p) => p.miles), 0.04)
  const x = (v: number) => PAD.l + (W - PAD.l - PAD.r) * ((v - xs.lo) / (xs.hi - xs.lo))
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - ys.lo) / (ys.hi - ys.lo))
  return (
    <Frame fmt={(n) => compactMoney(Math.round(n))} lo={ys.lo} hi={ys.hi} title={title}>
      {points.map((p, i) => <circle key={i} cx={x(p.miles)} cy={y(p.price)} r="2.5" className="fill-muted-foreground/45" />)}
      {[0, 0.5, 1].map((f) => <text key={f} x={PAD.l + (W - PAD.l - PAD.r) * f} y={H - 7} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'} className="fill-muted-foreground text-[10px] tabular-nums">{compactNum(Math.max(0, Math.round(xs.lo + (xs.hi - xs.lo) * f)))} mi</text>)}
      {highlight && (
        <g>
          <circle cx={x(highlight.miles)} cy={y(highlight.price)} r="9" className="fill-primary/25" />
          <circle cx={x(highlight.miles)} cy={y(highlight.price)} r="4.5" className="fill-primary stroke-background" strokeWidth="1.5" />
        </g>
      )}
    </Frame>
  )
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}
