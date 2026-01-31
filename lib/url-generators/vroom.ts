import { CarSite, SearchCriteria } from './types'

export const vroom: CarSite = {
  id: 'vroom',
  name: 'Vroom',
  logo: '/logos/vroom.svg',
  color: '#00c8ff',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.vroom.com/cars'
    const filters: string[] = []

    if (criteria.makeName) {
      filters.push(`make=${encodeURIComponent(criteria.makeName.toLowerCase())}`)
    }

    if (criteria.modelName) {
      filters.push(`model=${encodeURIComponent(criteria.modelName.toLowerCase())}`)
    }

    if (criteria.yearMin || criteria.yearMax) {
      const minYear = criteria.yearMin || 1990
      const maxYear = criteria.yearMax || new Date().getFullYear() + 1
      filters.push(`year=${minYear}-${maxYear}`)
    }

    if (criteria.priceMin || criteria.priceMax) {
      const minPrice = criteria.priceMin || 0
      const maxPrice = criteria.priceMax || 1000000
      filters.push(`price=${minPrice}-${maxPrice}`)
    }

    if (criteria.mileageMax) {
      filters.push(`miles=0-${criteria.mileageMax}`)
    }

    return filters.length > 0 ? `${baseUrl}?${filters.join('&')}` : baseUrl
  },
}
