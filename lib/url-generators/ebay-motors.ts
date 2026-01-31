import { CarSite, SearchCriteria } from './types'

export const ebayMotors: CarSite = {
  id: 'ebay-motors',
  name: 'eBay Motors',
  logo: '/logos/ebay-motors.svg',
  color: '#e53238',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.ebay.com/sch/Cars-Trucks/6001/i.html'
    const params = new URLSearchParams()

    const keywords: string[] = []
    if (criteria.makeName) {
      keywords.push(criteria.makeName)
    }
    if (criteria.modelName) {
      keywords.push(criteria.modelName)
    }

    if (keywords.length > 0) {
      params.set('_nkw', keywords.join(' '))
    }

    if (criteria.yearMin) {
      params.set('Year%20Min', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('Year%20Max', criteria.yearMax.toString())
    }

    if (criteria.priceMin) {
      params.set('_udlo', criteria.priceMin.toString())
    }

    if (criteria.priceMax) {
      params.set('_udhi', criteria.priceMax.toString())
    }

    if (criteria.mileageMax) {
      params.set('Vehicle%20Mileage', `0-${criteria.mileageMax}`)
    }

    if (criteria.zipCode) {
      params.set('_stpos', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('_sadis', criteria.radius.toString())
    }

    params.set('LH_ItemCondition', '3000') // Used vehicles

    return `${baseUrl}?${params.toString()}`
  },
}
