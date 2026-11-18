import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">We couldn’t find that page</h1>
      <p className="mt-2 text-muted-foreground">The listing may have been removed, or the link is mistyped.</p>
      <Button asChild className="mt-6"><Link href="/search/listings">Browse all listings</Link></Button>
    </div>
  )
}
