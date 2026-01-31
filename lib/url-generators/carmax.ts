import { CarSite, SearchCriteria } from './types'

export const carMax: CarSite = {
  id: 'carmax',
  name: 'CarMax',
  logo: '/logos/carmax.svg',
  color: '#0052cc',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.carmax.com/cars'
    const pathParts: string[] = []
    const params = new URLSearchParams()

    if (criteria.makeName) {
      pathParts.push(criteria.makeName.toLowerCase().replace(/\s+/g, '-'))

      if (criteria.modelName) {
        pathParts.push(criteria.modelName.toLowerCase().replace(/\s+/g, '-'))
      }
    }

    if (criteria.yearMin) {
      params.set('year', criteria.yearMin.toString())
    }

    if (criteria.yearMax && criteria.yearMin) {
      params.set('year', `${criteria.yearMin}-${criteria.yearMax}`)
    } else if (criteria.yearMax) {
      params.set('year', `1990-${criteria.yearMax}`)
    }

    if (criteria.priceMax) {
      params.set('price', `0-${criteria.priceMax}`)
    }

    if (criteria.mileageMax) {
      params.set('mileage', `0-${criteria.mileageMax}`)
    }

    if (criteria.zipCode) {
      params.set('zip', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('radius', criteria.radius.toString())
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
