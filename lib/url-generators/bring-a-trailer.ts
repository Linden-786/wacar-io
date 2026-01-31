import { CarSite, SearchCriteria } from './types'

export const bringATrailer: CarSite = {
  id: 'bring-a-trailer',
  name: 'Bring a Trailer',
  logo: '/logos/bring-a-trailer.svg',
  color: '#1a1a1a',
  generateUrl: (criteria: SearchCriteria): string => {
    const baseUrl = 'https://bringatrailer.com/auctions/'
    const params = new URLSearchParams()

    const searchTerms: string[] = []
    if (criteria.makeName) {
      searchTerms.push(criteria.makeName)
    }
    if (criteria.modelName) {
      searchTerms.push(criteria.modelName)
    }

    if (searchTerms.length > 0) {
      params.set('s', searchTerms.join(' '))
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
