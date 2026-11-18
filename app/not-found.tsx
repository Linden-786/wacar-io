import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">We couldn’t find that page</h1>
      <p className="mt-2 text-muted-foreground">The listing may have been removed, or the link is mistyped.</p>
      <Link href="/search/listings" className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Browse all listings</Link>
    </div>
  )
}
