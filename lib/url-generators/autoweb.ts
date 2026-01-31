import { CarSite, SearchCriteria } from './types'

export const autoWeb: CarSite = {
  id: 'autoweb',
  name: 'AutoWeb',
  logo: '/logos/autoweb.svg',
  color: '#ff6b00',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.autoweb.com/used-cars'
    const params = new URLSearchParams()

    if (criteria.makeName) {
      params.set('make', criteria.makeName.toLowerCase().replace(/\s+/g, '-'))
    }

    if (criteria.modelName) {
      params.set('model', criteria.modelName.toLowerCase().replace(/\s+/g, '-'))
    }

    if (criteria.yearMin) {
      params.set('yearFrom', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('yearTo', criteria.yearMax.toString())
    }

    if (criteria.priceMin) {
      params.set('priceFrom', criteria.priceMin.toString())
    }

    if (criteria.priceMax) {
      params.set('priceTo', criteria.priceMax.toString())
    }

    if (criteria.mileageMax) {
      params.set('mileageTo', criteria.mileageMax.toString())
    }

    if (criteria.zipCode) {
      params.set('zip', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('radius', criteria.radius.toString())
    }

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  },
}
