import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ListingsExplorer } from '@/components/listings-explorer'

export const metadata: Metadata = { title: 'Listings' }

export default function ListingsPage() {
  return <Suspense><ListingsExplorer /></Suspense>
}
