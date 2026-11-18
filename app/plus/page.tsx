import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Wacar Plus' }

const FREE = ['Plain-language search and every vehicle filter', 'Map, grid and table views with all sort orders', 'Price history at the current seller and days listed', 'Leaderboard against comparable listings', 'Deal check for dealer quotes', 'Recalls and complaints from NHTSA', 'Favorites, hidden listings and saved searches', 'Model overviews and used-price research']
const PLUS = ['Filter by installed options, top features and total MSRP', 'Installed options and build sheet on every listing', 'Previous-seller history for a VIN', 'Recently sold listings and past market snapshots', 'Rank filter options by price or days for sale', 'Email alerts for price drops and new matches']

export default function PlusPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Wacar Plus</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Plus is the planned paid tier for deeper build and history data. Checkout is not open yet, so during the preview every Plus feature below is switched on for everyone.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[{ name: 'Free', price: '$0', items: FREE, note: 'No ads. No selling your contact details to dealers.' }, { name: 'Plus', price: 'Pricing to be announced', items: PLUS, note: 'Included for everyone during the preview.' }].map((t) => (
          <Card key={t.name} className={t.name === 'Plus' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">{t.name}{t.name === 'Plus' && <Badge>Open during preview</Badge>}</CardTitle>
              <p className="text-2xl font-bold">{t.price}</p>
              <CardDescription>{t.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">{t.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}</li>)}</ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
