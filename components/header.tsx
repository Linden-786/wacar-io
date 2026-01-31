import Link from 'next/link'
import { Car } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Car className="h-6 w-6" />
          <span>Wacar.io</span>
        </Link>
        <nav className="ml-auto flex gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  )
}
