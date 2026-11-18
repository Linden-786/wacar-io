'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { SearchBox } from '@/components/search-box'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/lib/client-store'

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
            <Button key={n.href} asChild size="sm" variant={path.startsWith(n.match) ? 'secondary' : 'ghost'} className={path.startsWith(n.match) ? 'px-2.5' : 'px-2.5 text-muted-foreground'}>
              <Link href={n.href}>
                {n.label}
                {n.label === 'Saved' && favorites.list.length > 0 && <span className="ml-1 text-xs tabular-nums text-primary">{favorites.list.length}</span>}
              </Link>
            </Button>
          ))}
          <Button type="button" variant="ghost" size="icon" className="ml-1 h-9 w-9 text-muted-foreground" aria-label="Toggle dark mode" onClick={() => setTheme(theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark')) ? 'light' : 'dark')}>
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </Button>
        </nav>
      </div>
    </header>
  )
}
