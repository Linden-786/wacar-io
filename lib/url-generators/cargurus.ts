import { CarSite, SearchCriteria } from './types'

export const carGurus: CarSite = {
  id: 'cargurus',
  name: 'CarGurus',
  logo: '/logos/cargurus.svg',
  color: '#00a0df',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action'
    const params = new URLSearchParams()

    params.set('sourceContext', 'carGurusHomePageModel')
    params.set('inventorySearchWidgetType', 'AUTO')
    params.set('sortDir', 'ASC')
    params.set('sortType', 'DEAL_SCORE')

    if (criteria.condition === 'new') {
      params.set('newUsed', '1')
    } else if (criteria.condition === 'used') {
      params.set('newUsed', '2')
    } else {
      params.set('newUsed', '3')
    }

    if (criteria.makeName) {
      params.set('selectedMakeId', criteria.makeName)
    }

    if (criteria.modelName) {
      params.set('selectedModelId', criteria.modelName)
    }

    if (criteria.yearMin) {
      params.set('startYear', criteria.yearMin.toString())
    }

    if (criteria.yearMax) {
      params.set('endYear', criteria.yearMax.toString())
    }

    if (criteria.priceMax) {
      params.set('maxPrice', criteria.priceMax.toString())
    }

    if (criteria.priceMin) {
      params.set('minPrice', criteria.priceMin.toString())
    }

    if (criteria.mileageMax) {
      params.set('maxMileage', criteria.mileageMax.toString())
    }

    if (criteria.zipCode) {
      params.set('zip', criteria.zipCode)
    }

    if (criteria.radius) {
      params.set('distance', criteria.radius.toString())
    }

    return `${baseUrl}?${params.toString()}`
  },
}
