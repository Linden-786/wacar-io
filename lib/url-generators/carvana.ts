import { CarSite, SearchCriteria } from './types'

export const carvana: CarSite = {
  id: 'carvana',
  name: 'Carvana',
  logo: '/logos/carvana.svg',
  color: '#00aed9',
  generateUrl: (criteria: SearchCriteria): string => {
    const pathParts: string[] = []
    const filters: string[] = []

    if (criteria.makeName) {
      pathParts.push(criteria.makeName.toLowerCase().replace(/\s+/g, '-'))

      if (criteria.modelName) {
        pathParts.push(criteria.modelName.toLowerCase().replace(/\s+/g, '-'))
      }
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
      filters.push(`mileage=0-${criteria.mileageMax}`)
    }

    let url = 'https://www.carvana.com/cars'
    if (pathParts.length > 0) {
      url += '/' + pathParts.join('-')
    }

    if (filters.length > 0) {
      url += '?' + filters.join('&')
    }

    return url
  },
}
