import { CarSite, SearchCriteria } from './types'

export const carsCom: CarSite = {
  id: 'cars-com',
  name: 'Cars.com',
  logo: '/logos/cars-com.svg',
  color: '#8534d4',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.cars.com/shopping/results/'
    const params = new URLSearchParams()

    if (criteria.condition === 'new') {
      params.set('stock_type', 'new')
    } else if (criteria.condition === 'used') {
      params.set('stock_type', 'used')
    } else {
      params.set('stock_type', 'all')
    }

    if (criteria.makeName) {
      params.set('makes[]', criteria.makeName.toLowerCase().replace(/\s+/g, '_'))
    }

    if (criteria.modelName && criteria.makeName) {
      params.set('models[]', `${criteria.makeName.toLowerCase().replace(/\s+/g, '_')}-${criteria.modelName.toLowerCase().replace(/\s+/g, '_')}`)
    }

    if (criteria.yearMin) {
      params.set('year_min', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('year_max', criteria.yearMax.toString())
    }

    if (criteria.priceMax) {
      params.set('price_max', criteria.priceMax.toString())
    }

    if (criteria.priceMin) {
      params.set('price_min', criteria.priceMin.toString())
    }

    if (criteria.mileageMax) {
      params.set('mileage_max', criteria.mileageMax.toString())
    }

    if (criteria.zipCode) {
      params.set('zip', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('maximum_distance', criteria.radius.toString())
    }

    return `${baseUrl}?${params.toString()}`
  },
}
