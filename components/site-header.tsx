'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { SearchBox } from '@/components/search-box'
import { useTheme } from '@/components/theme-provider'
import { useFavorites } from '@/lib/client-store'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/search/filters', label: 'Search', match: '/search' },
  { href: '/research/used-car-prices', label: 'Research', match: '/research' },
  { href: '/saved', label: 'Saved', match: '/saved' },
  { href: '/plus', label: 'Plus', match: '/plus' },
]

export function SiteHeader() {
  const path = usePathname()
  const { theme, setTheme } = useTheme()
  const favorites = useFavorites()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-sm font-black text-primary-foreground">W</span>
          <span className="hidden sm:inline">wacar</span>
        </Link>
        {path !== '/' && <div className="hidden min-w-0 max-w-md flex-1 md:block"><SearchBox /></div>}
        <nav className="ml-auto flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                path.startsWith(n.match) && 'bg-secondary text-foreground',
              )}
            >
              {n.label}
              {n.label === 'Saved' && favorites.list.length > 0 && <span className="ml-1 text-xs tabular-nums text-primary">{favorites.list.length}</span>}
            </Link>
          ))}
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="ml-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>
        </nav>
      </div>
    </header>
  )
}
