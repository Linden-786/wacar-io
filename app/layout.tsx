import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wacar.io - Search All Car Sites at Once',
  description: 'Find your perfect car by searching all major car listing sites in one place. Compare prices across Cars.com, CarGurus, Carvana, AutoTrader, and more.',
  keywords: ['car search', 'used cars', 'car aggregator', 'buy car', 'car listings'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="wacar-theme">
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              <div className="container">
                <p>&copy; {new Date().getFullYear()} Wacar.io. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
