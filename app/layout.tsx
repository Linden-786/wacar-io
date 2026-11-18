import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { getStore } from '@/lib/data/query'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Wacar — search every car for sale, with the history behind the price', template: '%s · Wacar' },
  description: 'Search dealer inventory nationwide by VIN-level detail: price history, days on the lot, installed options, comparable listings and market trends.',
  keywords: ['car search', 'used cars', 'car aggregator', 'buy car', 'car listings'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = getStore()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="wacar-theme">
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              <div className="container space-y-1">
                <p>{store.source === 'crawl' ? `Listings are collected from dealer websites in the ${store.region} area and may be out of date; confirm price and availability with the dealer.` : 'Preview build: inventory, dealers and prices shown are generated sample data, not real listings.'}</p>
                <p>&copy; {new Date().getFullYear()} Wacar.io</p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
