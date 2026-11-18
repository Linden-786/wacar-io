import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { MarketSummary } from '@/lib/data/query'
import { money, num, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

export type Row = MarketSummary & { key: string; href?: string }

const COLS: { id: string; label: string; cell: (r: Row) => string; tone?: (r: Row) => string }[] = [
  { id: 'active', label: 'For sale', cell: (r) => num(r.active) },
  { id: 'price', label: 'Avg price', cell: (r) => money(r.avgPrice) },
  { id: 'change', label: '30-day change', cell: (r) => pct(r.change30), tone: (r) => (r.change30 == null ? '' : r.change30 < 0 ? 'text-emerald-600 dark:text-emerald-400' : r.change30 > 0 ? 'text-rose-600 dark:text-rose-400' : '') },
  { id: 'miles', label: 'Avg miles', cell: (r) => num(r.avgMiles) },
  { id: 'days', label: 'Avg days listed', cell: (r) => (r.avgDays == null ? '—' : String(r.avgDays)) },
  { id: 'sold', label: 'Sold (30 d)', cell: (r) => num(r.sold30) },
  { id: 'sell', label: 'Days to sell', cell: (r) => (r.avgDaysToSell == null ? '—' : String(r.avgDaysToSell)) },
  { id: 'supply', label: 'Days supply', cell: (r) => (r.daysSupply == null ? '—' : String(r.daysSupply)) },
]

export function MarketTable({ title, first, rows, hide = [] }: { title?: string; first: string; rows: Row[]; hide?: string[] }) {
  const cols = COLS.filter((c) => !hide.includes(c.id))
  if (!rows.length) return null
  return (
    <section>
      {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
      <Card className="overflow-hidden shadow-none">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow><TableHead>{first}</TableHead>{cols.map((c) => <TableHead key={c.id} className="whitespace-nowrap text-right">{c.label}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.key}>
                <TableCell className="font-medium">{r.href ? <Link href={r.href} className="hover:underline">{r.key}</Link> : r.key}</TableCell>
                {cols.map((c) => <TableCell key={c.id} className={cn('text-right tabular-nums', c.tone?.(r))}>{c.cell(r)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  )
}
