import { SearchForm } from '@/components/search-form'
import { Car } from 'lucide-react'

export default function Home() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-2xl text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Car className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Search All Car Sites at Once
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find your perfect car by searching Cars.com, CarGurus, Carvana, AutoTrader, and 9 more sites simultaneously.
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <SearchForm />
        </div>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">We search these sites for you</h2>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          {[
            'Cars.com',
            'AutoTrader',
            'CarGurus',
            'Carvana',
            'CarMax',
            'TrueCar',
            'eBay Motors',
            'Craigslist',
            'Facebook Marketplace',
            'Bring a Trailer',
            'Cars & Bids',
            'Vroom',
            'AutoWeb',
          ].map((site) => (
            <span
              key={site}
              className="px-3 py-1 rounded-full bg-secondary"
            >
              {site}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
