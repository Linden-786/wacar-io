import { Suspense } from 'react'
import type { Metadata } from 'next'
import { FiltersBuilder } from '@/components/filters-builder'

export const metadata: Metadata = { title: 'Build a search' }

export default function FiltersPage() {
  return <Suspense><FiltersBuilder /></Suspense>
}
