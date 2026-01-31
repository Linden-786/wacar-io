import { CarSite, SearchCriteria } from './types'

export const facebookMarketplace: CarSite = {
  id: 'facebook-marketplace',
  name: 'Facebook Marketplace',
  logo: '/logos/facebook-marketplace.svg',
  color: '#1877f2',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.facebook.com/marketplace/vehicles'
    const params = new URLSearchParams()

    if (criteria.yearMin) {
      params.set('minYear', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('maxYear', criteria.yearMax.toString())
    }

    if (criteria.priceMin) {
      params.set('minPrice', criteria.priceMin.toString())
    }

    if (criteria.priceMax) {
      params.set('maxPrice', criteria.priceMax.toString())
    }

    if (criteria.mileageMax) {
      params.set('maxMileage', criteria.mileageMax.toString())
    }

    // Facebook uses make/model in search query
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

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  },
}
