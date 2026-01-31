export interface SearchCriteria {
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
  bodyType?: string
  condition?: 'new' | 'used' | 'all'
}

export interface CarSite {
  id: string
  name: string
  logo: string
  color: string
  generateUrl: (criteria: SearchCriteria) => string
}
