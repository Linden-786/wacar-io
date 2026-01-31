export interface CarListing {
  id: string
  title: string
  price: number | null
  year: number | null
  make: string | null
  model: string | null
  mileage: number | null
  location: string | null
  imageUrl: string | null
  listingUrl: string
  source: string
  sourceColor: string
  postedDate: string | null
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
}

export interface ScraperResult {
  listings: CarListing[]
  error?: string
}
