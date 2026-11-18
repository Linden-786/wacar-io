export interface RawDealer {
  id: string
  host: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
}

export interface RawListing {
  vin: string
  stock: string
  condition: 'new' | 'used' | 'certified'
  year: number
  make: string
  model: string
  trim: string
  price: number | null
  msrp: number | null
  miles: number
  extColorName: string
  extColor: string
  intColor: string
  engine: string
  transmission: string
  drivetrain: string
  fuel: string
  photo: string | null
  url: string
  /** date the dealer says the car entered inventory, YYYY-MM-DD */
  listedOn: string | null
  fees: { label: string; amount: number; total: boolean }[]
  dealerId: string
}

/** Fields decoded from the VIN by NHTSA vPIC. */
export interface Decoded {
  body: string
  drive: string
  fuel: string
  electrification: string
  cylinders: number
  displacement: string
  doors: number
  seats: number
  plantCity: string
  plantState: string
  plantCountry: string
}

/** One vehicle at one dealer, tracked across crawls. */
export interface TrackedListing extends RawListing {
  firstSeen: string
  lastSeen: string
  /** set when the car stops appearing on the dealer's site */
  goneOn: string | null
  /** [date, price, miles] each time the price changed */
  history: [string, number, number][]
  decoded: Decoded | null
}

export interface Snapshot {
  generatedAt: string
  region: string
  dealers: RawDealer[]
  listings: TrackedListing[]
}
