import { CarSite, SearchCriteria } from './types'

export const craigslist: CarSite = {
  id: 'craigslist',
  name: 'Craigslist',
  logo: '/logos/craigslist.svg',
  color: '#5b2d8e',
  generateUrl: (criteria: SearchCriteria): string => {
    // Default to national search
    const baseUrl = 'https://www.craigslist.org/search/cta'
    const params = new URLSearchParams()

    const searchTerms: string[] = []
    if (criteria.makeName) {
      searchTerms.push(criteria.makeName)
    }
    if (criteria.modelName) {
      searchTerms.push(criteria.modelName)
    }

    if (searchTerms.length > 0) {
      params.set('query', searchTerms.join(' '))
    }

    if (criteria.yearMin) {
      params.set('min_auto_year', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('max_auto_year', criteria.yearMax.toString())
    }

    if (criteria.priceMin) {
      params.set('min_price', criteria.priceMin.toString())
    }

    if (criteria.priceMax) {
      params.set('max_price', criteria.priceMax.toString())
    }

    if (criteria.mileageMax) {
      params.set('max_auto_miles', criteria.mileageMax.toString())
    }

    if (criteria.zipCode) {
      params.set('postal', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('search_distance', criteria.radius.toString())
    }

    return `${baseUrl}?${params.toString()}`
  },
}
