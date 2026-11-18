export type Condition = 'new' | 'used' | 'certified'
export type Status = 'active' | 'sold'

export interface Dealer {
  id: string
  name: string
  group: string | null
  type: 'franchise' | 'independent' | 'online'
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  phone: string
  docFee: number
}

export interface PricePoint {
  /** days ago (0 = today) */
  day: number
  price: number
  miles: number
}

export interface PreviousSeller {
  dealer: string
  city: string
  state: string
  fromDay: number
  toDay: number
  firstPrice: number
  lastPrice: number
  miles: number
}

export interface InstalledOption {
  code: string
  name: string
  price: number
}

export interface Listing {
  vin: string
  stock: string
  status: Status
  condition: Condition
  certProgram: string | null
  year: number
  make: string
  model: string
  generation: string
  trim: string
  version: string
  body: string
  seats: number
  doors: number
  fuel: string
  powertrain: string
  engine: string
  cylinders: number
  drivetrain: string
  transmission: string
  extColor: string
  extColorName: string
  intColor: string
  price: number | null
  baseMsrp: number
  msrp: number
  miles: number
  options: InstalledOption[]
  features: string[]
  title: string
  prevUse: string
  availability: string
  plant: string
  country: string
  dealerId: string
  /** days since first listed at the current seller */
  daysListed: number
  /** days ago it sold (sold listings only) */
  soldDay: number | null
  history: PricePoint[]
  previousSellers: PreviousSeller[]
}

/** Listing joined with its dealer plus computed fields, as sent to the client. */
export interface ListingView extends Listing {
  dealer: Dealer
  discount: number | null
  distance: number | null
}

export interface FacetOption {
  value: string
  count: number
  avgPrice: number | null
  avgDays: number | null
}

export interface RangeStats {
  min: number
  max: number
  median: number
  p25: number
  p75: number
  mean: number
}
