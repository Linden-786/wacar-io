import { CarSite, SearchCriteria } from './types'

export const trueCar: CarSite = {
  id: 'truecar',
  name: 'TrueCar',
  logo: '/logos/truecar.svg',
  color: '#0070f3',
  generateUrl: (criteria: SearchCriteria): string => {
    const pathParts: string[] = ['used-cars-for-sale', 'listings']
    const params = new URLSearchParams()

    if (criteria.makeName) {
      params.set('make', criteria.makeName.toLowerCase().replace(/\s+/g, '-'))
    }

    if (criteria.modelName) {
      params.set('model', criteria.modelName.toLowerCase().replace(/\s+/g, '-'))
    }

    if (criteria.yearMin) {
      params.set('year_low', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('year_high', criteria.yearMax.toString())
    }

    if (criteria.priceMin) {
      params.set('price_low', criteria.priceMin.toString())
    }

    if (criteria.priceMax) {
      params.set('price_high', criteria.priceMax.toString())
    }

    if (criteria.mileageMax) {
      params.set('mileage_high', criteria.mileageMax.toString())
    }

    if (criteria.zipCode) {
      params.set('postal_code', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('search_radius', criteria.radius.toString())
    }

    const queryString = params.toString()
    let url = `https://www.truecar.com/${pathParts.join('/')}`

    if (queryString) {
      url += '?' + queryString
    }

    return url
  },
}
