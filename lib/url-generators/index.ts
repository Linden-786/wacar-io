import { CarSite, SearchCriteria } from './types'
import { carsCom } from './cars-com'
import { carGurus } from './cargurus'
import { carvana } from './carvana'
import { autoTrader } from './autotrader'
import { ebayMotors } from './ebay-motors'
import { trueCar } from './truecar'
import { bringATrailer } from './bring-a-trailer'
import { carsAndBids } from './cars-and-bids'
import { vroom } from './vroom'
import { carMax } from './carmax'
import { craigslist } from './craigslist'
import { facebookMarketplace } from './facebook-marketplace'
import { autoWeb } from './autoweb'

export type { SearchCriteria, CarSite }

export const carSites: CarSite[] = [
  carsCom,
  autoTrader,
  carGurus,
  carvana,
  carMax,
  trueCar,
  ebayMotors,
  craigslist,
  facebookMarketplace,
  bringATrailer,
  carsAndBids,
  vroom,
  autoWeb,
]

export function generateAllUrls(criteria: SearchCriteria): { site: CarSite; url: string }[] {
  return carSites.map((site) => ({
    site,
    url: site.generateUrl(criteria),
  }))
}
