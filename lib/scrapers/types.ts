export interface CarListing {
  id: string
  source: string
  sourceUrl: string
  sourceLogo?: string
  title: string
  price: number | null
  year: number | null
  make: string | null
  model: string | null
  mileage: number | null
  location: string | null
  imageUrl: string | null
  description?: string
  postedAt?: string
}

export interface SearchParams {
  make?: string
  makeName?: string
  model?: string
  modelName?: string
  yearMin?: number
  yearMax?: number
  priceMin?: number
  priceMax?: number
  mileageMax?: number
  zipCode?: string
  radius?: number
  condition?: 'new' | 'used' | 'all'
}

export interface ScraperResult {
  source: string
  listings: CarListing[]
  error?: string
}
