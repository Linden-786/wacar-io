import { CarSite, SearchCriteria } from './types'

export const carsAndBids: CarSite = {
  id: 'cars-and-bids',
  name: 'Cars & Bids',
  logo: '/logos/cars-and-bids.svg',
  color: '#ff4444',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://carsandbids.com/search'
    const params = new URLSearchParams()

    if (criteria.makeName) {
      params.set('make', criteria.makeName)
    }

    if (criteria.modelName) {
      params.set('model', criteria.modelName)
    }

    if (criteria.yearMin) {
      params.set('yearFrom', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('yearTo', criteria.yearMax.toString())
    }

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  },
}
