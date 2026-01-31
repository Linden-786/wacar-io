import { CarSite, SearchCriteria } from './types'

export const autoTrader: CarSite = {
  id: 'autotrader',
  name: 'AutoTrader',
  logo: '/logos/autotrader.svg',
  color: '#e6480e',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.autotrader.com/cars-for-sale/all-cars'
    const pathParts: string[] = []
    const params = new URLSearchParams()

    if (criteria.makeName) {
      pathParts.push(criteria.makeName.toLowerCase().replace(/\s+/g, '-'))

      if (criteria.modelName) {
        pathParts.push(criteria.modelName.toLowerCase().replace(/\s+/g, '-'))
      }
    }

    if (criteria.condition === 'new') {
      params.set('listingTypes', 'NEW')
    } else if (criteria.condition === 'used') {
      params.set('listingTypes', 'USED,CERTIFIED')
    }

    if (criteria.yearMin) {
      params.set('startYear', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('endYear', criteria.yearMax.toString())
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

    if (criteria.zipCode) {
      params.set('zip', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('searchRadius', criteria.radius.toString())
    }

    let url = baseUrl
    if (pathParts.length > 0) {
      url += '/' + pathParts.join('/')
    }

    const queryString = params.toString()
    if (queryString) {
      url += '?' + queryString
    }

    return url
  },
}
