// Vehicle catalog used to generate the demo inventory. Values are approximate
// and exist only to make the sample market behave plausibly.

export interface PowertrainDef {
  fuel: string
  powertrain: string
  engine: string
  cyl: number
  trans: string
  drives: string[]
  add: number
}

export interface ModelDef {
  make: string
  model: string
  body: string
  seats: number
  doors: number
  base: number
  gens: { name: string; from: number; to: number }[]
  trims: { name: string; add: number }[]
  pts: PowertrainDef[]
  plant: string
  country: string
  /** relative share of the market */
  weight: number
}

const ICE = (engine: string, cyl: number, drives: string[], add = 0, trans = 'Automatic'): PowertrainDef => ({
  fuel: 'Gasoline', powertrain: 'ICE', engine, cyl, trans, drives, add,
})
const HEV = (engine: string, drives: string[], add = 1800): PowertrainDef => ({
  fuel: 'Hybrid', powertrain: 'HEV', engine, cyl: 4, trans: 'CVT', drives, add,
})
const PHEV = (engine: string, drives: string[], add = 6500): PowertrainDef => ({
  fuel: 'Plug-in Hybrid', powertrain: 'PHEV', engine, cyl: 4, trans: 'Automatic', drives, add,
})
const BEV = (engine: string, drives: string[], add = 0): PowertrainDef => ({
  fuel: 'Electric', powertrain: 'BEV', engine, cyl: 0, trans: 'Single-speed', drives, add,
})
const DSL = (engine: string, cyl: number, drives: string[], add = 4500): PowertrainDef => ({
  fuel: 'Diesel', powertrain: 'ICE', engine, cyl, trans: 'Automatic', drives, add,
})

const t = (...pairs: [string, number][]) => pairs.map(([name, add]) => ({ name, add }))
const g = (...triples: [string, number, number][]) => triples.map(([name, from, to]) => ({ name, from, to }))

export const MODELS: ModelDef[] = [
  { make: 'Toyota', model: 'RAV4', body: 'SUV', seats: 5, doors: 4, base: 29500, weight: 10,
    gens: g(['4th gen (XA40)', 2016, 2018], ['5th gen (XA50)', 2019, 2026]),
    trims: t(['LE', 0], ['XLE', 1800], ['XLE Premium', 4200], ['Adventure', 5800], ['Limited', 8600]),
    pts: [ICE('2.5L I4', 4, ['FWD', 'AWD']), HEV('2.5L I4 Hybrid', ['AWD']), PHEV('2.5L I4 Plug-in', ['AWD'], 12500)],
    plant: 'Georgetown, KY', country: 'United States' },
  { make: 'Toyota', model: 'Camry', body: 'Sedan', seats: 5, doors: 4, base: 28400, weight: 7,
    gens: g(['XV70', 2018, 2024], ['XV80', 2025, 2026]),
    trims: t(['LE', 0], ['SE', 1500], ['XLE', 4300], ['XSE', 5200]),
    pts: [ICE('2.5L I4', 4, ['FWD', 'AWD']), HEV('2.5L I4 Hybrid', ['FWD', 'AWD'], 1200)],
    plant: 'Georgetown, KY', country: 'United States' },
  { make: 'Toyota', model: 'Tacoma', body: 'Pickup', seats: 5, doors: 4, base: 32900, weight: 7,
    gens: g(['3rd gen (N300)', 2016, 2023], ['4th gen (N400)', 2024, 2026]),
    trims: t(['SR', 0], ['SR5', 3200], ['TRD Sport', 7400], ['TRD Off-Road', 9300], ['Limited', 16500], ['TRD Pro', 28000]),
    pts: [ICE('3.5L V6', 6, ['RWD', '4WD']), ICE('2.4L Turbo I4', 4, ['RWD', '4WD'], 900), ICE('3.5L V6', 6, ['4WD'], 0, 'Manual')],
    plant: 'Guanajuato, MX', country: 'Mexico' },
  { make: 'Toyota', model: '4Runner', body: 'SUV', seats: 7, doors: 4, base: 41800, weight: 4,
    gens: g(['5th gen (N280)', 2016, 2024], ['6th gen (N500)', 2025, 2026]),
    trims: t(['SR5', 0], ['TRD Off-Road', 4300], ['Limited', 9800], ['TRD Pro', 17500]),
    pts: [ICE('4.0L V6', 6, ['RWD', '4WD'])],
    plant: 'Tahara, JP', country: 'Japan' },
  { make: 'Toyota', model: 'Prius', body: 'Hatchback', seats: 5, doors: 4, base: 28500, weight: 3,
    gens: g(['4th gen (XW50)', 2016, 2022], ['5th gen (XW60)', 2023, 2026]),
    trims: t(['LE', 0], ['XLE', 3400], ['Limited', 7000]),
    pts: [HEV('2.0L I4 Hybrid', ['FWD', 'AWD'], 0), PHEV('2.0L I4 Plug-in', ['FWD'], 5000)],
    plant: 'Tsutsumi, JP', country: 'Japan' },
  { make: 'Honda', model: 'Civic', body: 'Sedan', seats: 5, doors: 4, base: 24900, weight: 8,
    gens: g(['10th gen (FC)', 2016, 2021], ['11th gen (FE)', 2022, 2026]),
    trims: t(['LX', 0], ['Sport', 1600], ['EX', 3000], ['Touring', 6100], ['Si', 5400], ['Type R', 20500]),
    pts: [ICE('2.0L I4', 4, ['FWD']), ICE('1.5L Turbo I4', 4, ['FWD'], 900), ICE('1.5L Turbo I4', 4, ['FWD'], 900, 'Manual'), HEV('2.0L I4 Hybrid', ['FWD'], 2600)],
    plant: 'Greensburg, IN', country: 'United States' },
  { make: 'Honda', model: 'CR-V', body: 'SUV', seats: 5, doors: 4, base: 30800, weight: 9,
    gens: g(['5th gen (RW)', 2017, 2022], ['6th gen (RS)', 2023, 2026]),
    trims: t(['LX', 0], ['EX', 2500], ['EX-L', 5100], ['Sport', 4200], ['Sport Touring', 9600]),
    pts: [ICE('1.5L Turbo I4', 4, ['FWD', 'AWD']), HEV('2.0L I4 Hybrid', ['FWD', 'AWD'])],
    plant: 'East Liberty, OH', country: 'United States' },
  { make: 'Honda', model: 'Accord', body: 'Sedan', seats: 5, doors: 4, base: 28900, weight: 5,
    gens: g(['10th gen (CV)', 2018, 2022], ['11th gen (CY)', 2023, 2026]),
    trims: t(['LX', 0], ['EX', 2100], ['Sport', 3800], ['EX-L', 5400], ['Touring', 10200]),
    pts: [ICE('1.5L Turbo I4', 4, ['FWD']), HEV('2.0L I4 Hybrid', ['FWD'], 2200)],
    plant: 'Marysville, OH', country: 'United States' },
  { make: 'Honda', model: 'Pilot', body: 'SUV', seats: 8, doors: 4, base: 40200, weight: 4,
    gens: g(['3rd gen (YF6)', 2016, 2022], ['4th gen (YG1)', 2023, 2026]),
    trims: t(['Sport', 0], ['EX-L', 3300], ['TrailSport', 9000], ['Touring', 7700], ['Elite', 13200]),
    pts: [ICE('3.5L V6', 6, ['FWD', 'AWD'])],
    plant: 'Lincoln, AL', country: 'United States' },
  { make: 'Ford', model: 'F-150', body: 'Pickup', seats: 5, doors: 4, base: 39400, weight: 12,
    gens: g(['13th gen (P552)', 2016, 2020], ['14th gen (P702)', 2021, 2026]),
    trims: t(['XL', 0], ['XLT', 7300], ['Lariat', 21500], ['King Ranch', 31000], ['Platinum', 33500], ['Raptor', 41000]),
    pts: [ICE('2.7L EcoBoost V6', 6, ['RWD', '4WD']), ICE('5.0L V8', 8, ['RWD', '4WD'], 2400), ICE('3.5L EcoBoost V6', 6, ['4WD'], 2900), HEV('3.5L PowerBoost Hybrid', ['4WD'], 4500)],
    plant: 'Dearborn, MI', country: 'United States' },
  { make: 'Ford', model: 'Mustang', body: 'Coupe', seats: 4, doors: 2, base: 32500, weight: 3,
    gens: g(['S550', 2016, 2023], ['S650', 2024, 2026]),
    trims: t(['EcoBoost', 0], ['EcoBoost Premium', 5500], ['GT', 11000], ['GT Premium', 15500], ['Dark Horse', 28000]),
    pts: [ICE('2.3L EcoBoost I4', 4, ['RWD']), ICE('5.0L V8', 8, ['RWD'], 1500), ICE('5.0L V8', 8, ['RWD'], 1500, 'Manual')],
    plant: 'Flat Rock, MI', country: 'United States' },
  { make: 'Ford', model: 'Bronco', body: 'SUV', seats: 5, doors: 4, base: 39600, weight: 4,
    gens: g(['6th gen (U725)', 2021, 2026]),
    trims: t(['Base', 0], ['Big Bend', 2400], ['Outer Banks', 8700], ['Badlands', 11500], ['Wildtrak', 21500], ['Raptor', 51000]),
    pts: [ICE('2.3L EcoBoost I4', 4, ['4WD']), ICE('2.7L EcoBoost V6', 6, ['4WD'], 1900), ICE('2.3L EcoBoost I4', 4, ['4WD'], 0, 'Manual')],
    plant: 'Wayne, MI', country: 'United States' },
  { make: 'Ford', model: 'Mustang Mach-E', body: 'SUV', seats: 5, doors: 4, base: 41900, weight: 3,
    gens: g(['1st gen', 2021, 2026]),
    trims: t(['Select', 0], ['Premium', 4000], ['GT', 14000], ['Rally', 19000]),
    pts: [BEV('Standard Range 72 kWh', ['RWD', 'AWD']), BEV('Extended Range 91 kWh', ['RWD', 'AWD'], 5000)],
    plant: 'Cuautitlán, MX', country: 'Mexico' },
  { make: 'Chevrolet', model: 'Silverado 1500', body: 'Pickup', seats: 5, doors: 4, base: 38800, weight: 9,
    gens: g(['3rd gen (K2)', 2016, 2018], ['4th gen (T1)', 2019, 2026]),
    trims: t(['WT', 0], ['Custom', 5200], ['LT', 9800], ['RST', 13800], ['LTZ', 19500], ['High Country', 25800], ['ZR2', 33000]),
    pts: [ICE('2.7L Turbo I4', 4, ['RWD', '4WD']), ICE('5.3L V8', 8, ['RWD', '4WD'], 1900), ICE('6.2L V8', 8, ['4WD'], 4400), DSL('3.0L Duramax I6', 6, ['RWD', '4WD'], 2900)],
    plant: 'Fort Wayne, IN', country: 'United States' },
  { make: 'Chevrolet', model: 'Equinox', body: 'SUV', seats: 5, doors: 4, base: 28600, weight: 6,
    gens: g(['3rd gen', 2018, 2024], ['4th gen', 2025, 2026]),
    trims: t(['LS', 0], ['LT', 1500], ['RS', 4300], ['Premier', 5800]),
    pts: [ICE('1.5L Turbo I4', 4, ['FWD', 'AWD'])],
    plant: 'San Luis Potosí, MX', country: 'Mexico' },
  { make: 'Chevrolet', model: 'Tahoe', body: 'SUV', seats: 8, doors: 4, base: 58500, weight: 4,
    gens: g(['4th gen (K2UC)', 2016, 2020], ['5th gen (T1UC)', 2021, 2026]),
    trims: t(['LS', 0], ['LT', 5300], ['RST', 8600], ['Z71', 10800], ['Premier', 14500], ['High Country', 19800]),
    pts: [ICE('5.3L V8', 8, ['RWD', '4WD']), ICE('6.2L V8', 8, ['4WD'], 3200), DSL('3.0L Duramax I6', 6, ['RWD', '4WD'], 1800)],
    plant: 'Arlington, TX', country: 'United States' },
  { make: 'Chevrolet', model: 'Corvette', body: 'Coupe', seats: 2, doors: 2, base: 69900, weight: 2,
    gens: g(['C7', 2016, 2019], ['C8', 2020, 2026]),
    trims: t(['1LT', 0], ['2LT', 7500], ['3LT', 12200], ['Z06', 44000]),
    pts: [ICE('6.2L V8', 8, ['RWD'])],
    plant: 'Bowling Green, KY', country: 'United States' },
  { make: 'Tesla', model: 'Model 3', body: 'Sedan', seats: 5, doors: 4, base: 40500, weight: 7,
    gens: g(['Original', 2018, 2023], ['Highland', 2024, 2026]),
    trims: t(['Rear-Wheel Drive', 0], ['Long Range', 6500], ['Performance', 13500]),
    pts: [BEV('Single Motor', ['RWD']), BEV('Dual Motor', ['AWD'], 1000)],
    plant: 'Fremont, CA', country: 'United States' },
  { make: 'Tesla', model: 'Model Y', body: 'SUV', seats: 5, doors: 4, base: 45500, weight: 8,
    gens: g(['Original', 2020, 2024], ['Juniper', 2025, 2026]),
    trims: t(['Rear-Wheel Drive', 0], ['Long Range', 4500], ['Performance', 9500]),
    pts: [BEV('Single Motor', ['RWD']), BEV('Dual Motor', ['AWD'], 1000)],
    plant: 'Austin, TX', country: 'United States' },
  { make: 'BMW', model: '3 Series', body: 'Sedan', seats: 5, doors: 4, base: 45900, weight: 4,
    gens: g(['F30', 2016, 2018], ['G20', 2019, 2026]),
    trims: t(['330i', 0], ['330i xDrive', 2000], ['M340i', 14500], ['M340i xDrive', 16500]),
    pts: [ICE('2.0L Turbo I4', 4, ['RWD', 'AWD']), ICE('3.0L Turbo I6', 6, ['RWD', 'AWD'], 0), PHEV('2.0L Turbo Plug-in', ['RWD', 'AWD'], 2500)],
    plant: 'San Luis Potosí, MX', country: 'Mexico' },
  { make: 'BMW', model: 'X5', body: 'SUV', seats: 5, doors: 4, base: 66900, weight: 4,
    gens: g(['F15', 2016, 2018], ['G05', 2019, 2026]),
    trims: t(['sDrive40i', 0], ['xDrive40i', 2300], ['xDrive50e', 7700], ['M60i', 24500]),
    pts: [ICE('3.0L Turbo I6', 6, ['RWD', 'AWD']), ICE('4.4L Twin-Turbo V8', 8, ['AWD'], 0), PHEV('3.0L Turbo Plug-in', ['AWD'], 0)],
    plant: 'Spartanburg, SC', country: 'United States' },
  { make: 'BMW', model: 'M3', body: 'Sedan', seats: 5, doors: 4, base: 77900, weight: 1,
    gens: g(['F80', 2016, 2018], ['G80', 2021, 2026]),
    trims: t(['Base', 0], ['Competition', 4200], ['Competition xDrive', 8300], ['CS', 41000]),
    pts: [ICE('3.0L Twin-Turbo I6', 6, ['RWD', 'AWD']), ICE('3.0L Twin-Turbo I6', 6, ['RWD'], 0, 'Manual')],
    plant: 'Munich, DE', country: 'Germany' },
  { make: 'Subaru', model: 'Outback', body: 'Wagon', seats: 5, doors: 4, base: 30200, weight: 5,
    gens: g(['5th gen (BS)', 2016, 2019], ['6th gen (BT)', 2020, 2026]),
    trims: t(['Base', 0], ['Premium', 2300], ['Onyx Edition', 6800], ['Limited', 7500], ['Wilderness', 11000], ['Touring', 12500]),
    pts: [ICE('2.5L H4', 4, ['AWD'], 0, 'CVT'), ICE('2.4L Turbo H4', 4, ['AWD'], 2400, 'CVT')],
    plant: 'Lafayette, IN', country: 'United States' },
  { make: 'Subaru', model: 'Crosstrek', body: 'SUV', seats: 5, doors: 4, base: 26600, weight: 4,
    gens: g(['2nd gen (GT)', 2018, 2023], ['3rd gen (GU)', 2024, 2026]),
    trims: t(['Base', 0], ['Premium', 1200], ['Sport', 3800], ['Limited', 5500], ['Wilderness', 6700]),
    pts: [ICE('2.0L H4', 4, ['AWD'], 0, 'CVT'), ICE('2.5L H4', 4, ['AWD'], 900, 'CVT')],
    plant: 'Gunma, JP', country: 'Japan' },
  { make: 'Hyundai', model: 'Tucson', body: 'SUV', seats: 5, doors: 4, base: 29200, weight: 5,
    gens: g(['3rd gen (TL)', 2016, 2021], ['4th gen (NX4)', 2022, 2026]),
    trims: t(['SE', 0], ['SEL', 1800], ['XRT', 5200], ['N Line', 6000], ['Limited', 9800]),
    pts: [ICE('2.5L I4', 4, ['FWD', 'AWD']), HEV('1.6L Turbo Hybrid', ['AWD'], 2500), PHEV('1.6L Turbo Plug-in', ['AWD'], 9000)],
    plant: 'Montgomery, AL', country: 'United States' },
  { make: 'Hyundai', model: 'Ioniq 5', body: 'SUV', seats: 5, doors: 4, base: 43800, weight: 3,
    gens: g(['1st gen (NE)', 2022, 2026]),
    trims: t(['SE', 0], ['SEL', 3800], ['Limited', 10500], ['N', 23500]),
    pts: [BEV('Standard Range 63 kWh', ['RWD']), BEV('Long Range 84 kWh', ['RWD', 'AWD'], 4200)],
    plant: 'Ellabell, GA', country: 'United States' },
  { make: 'Kia', model: 'Telluride', body: 'SUV', seats: 8, doors: 4, base: 37500, weight: 5,
    gens: g(['1st gen (ON)', 2020, 2026]),
    trims: t(['LX', 0], ['S', 2300], ['EX', 5600], ['SX', 10700], ['SX Prestige', 15200]),
    pts: [ICE('3.8L V6', 6, ['FWD', 'AWD'])],
    plant: 'West Point, GA', country: 'United States' },
  { make: 'Kia', model: 'Sportage', body: 'SUV', seats: 5, doors: 4, base: 28700, weight: 4,
    gens: g(['4th gen (QL)', 2017, 2022], ['5th gen (NQ5)', 2023, 2026]),
    trims: t(['LX', 0], ['EX', 2400], ['X-Line', 5200], ['SX Prestige', 8600]),
    pts: [ICE('2.5L I4', 4, ['FWD', 'AWD']), HEV('1.6L Turbo Hybrid', ['FWD', 'AWD'], 1500)],
    plant: 'West Point, GA', country: 'United States' },
  { make: 'Jeep', model: 'Wrangler', body: 'SUV', seats: 5, doors: 4, base: 37900, weight: 6,
    gens: g(['JK', 2016, 2017], ['JL', 2018, 2026]),
    trims: t(['Sport', 0], ['Sport S', 3600], ['Willys', 7400], ['Sahara', 13000], ['Rubicon', 14500], ['Rubicon 392', 55000]),
    pts: [ICE('3.6L V6', 6, ['4WD']), ICE('3.6L V6', 6, ['4WD'], 0, 'Manual'), ICE('2.0L Turbo I4', 4, ['4WD'], 1000), PHEV('2.0L Turbo 4xe', ['4WD'], 9000)],
    plant: 'Toledo, OH', country: 'United States' },
  { make: 'Jeep', model: 'Grand Cherokee', body: 'SUV', seats: 5, doors: 4, base: 40900, weight: 5,
    gens: g(['WK2', 2016, 2021], ['WL', 2022, 2026]),
    trims: t(['Laredo', 0], ['Altitude', 4000], ['Limited', 7500], ['Overland', 19000], ['Summit', 23500]),
    pts: [ICE('3.6L V6', 6, ['RWD', '4WD']), ICE('5.7L V8', 8, ['4WD'], 3800), PHEV('2.0L Turbo 4xe', ['4WD'], 12000)],
    plant: 'Detroit, MI', country: 'United States' },
  { make: 'Porsche', model: '911', body: 'Coupe', seats: 4, doors: 2, base: 122000, weight: 1,
    gens: g(['991.2', 2017, 2019], ['992', 2020, 2026]),
    trims: t(['Carrera', 0], ['Carrera S', 17000], ['Carrera 4S', 24500], ['Targa 4S', 38000], ['Turbo S', 115000], ['GT3', 105000]),
    pts: [ICE('3.0L Twin-Turbo H6', 6, ['RWD', 'AWD']), ICE('3.0L Twin-Turbo H6', 6, ['RWD'], 0, 'Manual')],
    plant: 'Zuffenhausen, DE', country: 'Germany' },
  { make: 'Porsche', model: 'Macan', body: 'SUV', seats: 5, doors: 4, base: 64900, weight: 2,
    gens: g(['95B', 2016, 2024], ['Electric (XAB)', 2025, 2026]),
    trims: t(['Base', 0], ['T', 3700], ['S', 11500], ['GTS', 24500]),
    pts: [ICE('2.0L Turbo I4', 4, ['AWD']), ICE('2.9L Twin-Turbo V6', 6, ['AWD'], 0)],
    plant: 'Leipzig, DE', country: 'Germany' },
  { make: 'Mazda', model: 'CX-5', body: 'SUV', seats: 5, doors: 4, base: 29900, weight: 5,
    gens: g(['2nd gen (KF)', 2017, 2025], ['3rd gen', 2026, 2026]),
    trims: t(['S', 0], ['Select', 1600], ['Preferred', 3000], ['Carbon Edition', 4200], ['Premium Plus', 7900], ['Turbo Signature', 11800]),
    pts: [ICE('2.5L I4', 4, ['AWD']), ICE('2.5L Turbo I4', 4, ['AWD'], 2500)],
    plant: 'Hiroshima, JP', country: 'Japan' },
  { make: 'Mazda', model: 'MX-5 Miata', body: 'Convertible', seats: 2, doors: 2, base: 29800, weight: 1,
    gens: g(['ND', 2016, 2026]),
    trims: t(['Sport', 0], ['Club', 3500], ['Grand Touring', 5200]),
    pts: [ICE('2.0L I4', 4, ['RWD'], 0, 'Manual'), ICE('2.0L I4', 4, ['RWD'], 600)],
    plant: 'Hiroshima, JP', country: 'Japan' },
  { make: 'Rivian', model: 'R1S', body: 'SUV', seats: 7, doors: 4, base: 77700, weight: 1,
    gens: g(['Gen 1', 2022, 2024], ['Gen 2', 2025, 2026]),
    trims: t(['Adventure', 0], ['Ascend', 14000]),
    pts: [BEV('Dual-Motor Standard', ['AWD']), BEV('Dual-Motor Max Pack', ['AWD'], 7000), BEV('Tri-Motor Max Pack', ['AWD'], 22000)],
    plant: 'Normal, IL', country: 'United States' },
  { make: 'Volkswagen', model: 'Golf GTI', body: 'Hatchback', seats: 5, doors: 4, base: 32900, weight: 2,
    gens: g(['Mk7', 2016, 2021], ['Mk8', 2022, 2026]),
    trims: t(['S', 0], ['SE', 4800], ['Autobahn', 8700]),
    pts: [ICE('2.0L Turbo I4', 4, ['FWD']), ICE('2.0L Turbo I4', 4, ['FWD'], 0, 'Manual')],
    plant: 'Wolfsburg, DE', country: 'Germany' },
]

export const EXT_COLORS: { base: string; hex: string; names: string[]; weight: number }[] = [
  { base: 'White', hex: '#f4f4f2', names: ['Glacier White', 'Pearl White', 'Summit White', 'Oxford White'], weight: 22 },
  { base: 'Black', hex: '#17181a', names: ['Midnight Black', 'Jet Black', 'Obsidian', 'Agate Black'], weight: 19 },
  { base: 'Gray', hex: '#6b7076', names: ['Magnetic Gray', 'Carbonized Gray', 'Lunar Rock', 'Sonic Gray'], weight: 18 },
  { base: 'Silver', hex: '#c3c7cb', names: ['Celestial Silver', 'Iconic Silver', 'Lunar Silver'], weight: 12 },
  { base: 'Blue', hex: '#274b8f', names: ['Blueprint', 'Aegean Blue', 'Velocity Blue', 'Deep Sea Blue'], weight: 10 },
  { base: 'Red', hex: '#a3202a', names: ['Ruby Flare', 'Rapid Red', 'Radiant Red', 'Soul Red'], weight: 8 },
  { base: 'Green', hex: '#3d5a44', names: ['Army Green', 'Eruption Green', 'Forest Green'], weight: 3 },
  { base: 'Brown', hex: '#5c4534', names: ['Smoked Mesquite', 'Kodiak Brown'], weight: 1.5 },
  { base: 'Orange', hex: '#d2641e', names: ['Solar Octane', 'Twister Orange', 'Lava Orange'], weight: 1.5 },
  { base: 'Yellow', hex: '#e2bb1f', names: ['Accelerate Yellow', 'Grabber Yellow'], weight: 1 },
  { base: 'Beige', hex: '#cdbf9f', names: ['Quicksand', 'Desert Sand', 'Mojave'], weight: 2 },
  { base: 'Purple', hex: '#4c3a70', names: ['Twilight Purple', 'Reign'], weight: 0.5 },
]

export const INT_COLORS = ['Black', 'Gray', 'Beige', 'Brown', 'Red', 'White']
export const INT_WEIGHTS = [50, 18, 12, 10, 4, 6]

export const OPTION_POOL: { code: string; name: string; price: [number, number]; features: string[]; bodies?: string[] }[] = [
  { code: 'TEC', name: 'Technology Package', price: [1200, 2600], features: ['Adaptive Cruise Control', 'Head-Up Display'] },
  { code: 'PRM', name: 'Premium Package', price: [1800, 4200], features: ['Leather Seats', 'Ventilated Seats'] },
  { code: 'CWP', name: 'Cold Weather Package', price: [550, 1250], features: ['Heated Seats', 'Heated Steering Wheel'] },
  { code: 'PAN', name: 'Panoramic Roof', price: [1100, 1900], features: ['Panoramic Roof'] },
  { code: 'AUD', name: 'Premium Audio', price: [650, 3400], features: ['Premium Audio'] },
  { code: 'DRV', name: 'Driver Assistance Plus', price: [900, 2500], features: ['Adaptive Cruise Control', 'Blind Spot Monitor', '360 Camera'] },
  { code: 'TOW', name: 'Trailer Tow Package', price: [450, 1700], features: ['Tow Package'], bodies: ['Pickup', 'SUV'] },
  { code: 'ORP', name: 'Off-Road Package', price: [1300, 3900], features: ['Skid Plates', 'Locking Differential'], bodies: ['Pickup', 'SUV'] },
  { code: 'WHL', name: 'Upgraded Wheels', price: [600, 2800], features: [] },
  { code: 'PNT', name: 'Premium Paint', price: [395, 1500], features: [] },
  { code: 'SPT', name: 'Sport Package', price: [1500, 4800], features: ['Sport Suspension', 'Sport Seats'], bodies: ['Sedan', 'Coupe', 'Hatchback', 'Convertible'] },
  { code: '3RD', name: 'Third-Row Seating', price: [900, 1600], features: ['Third Row'], bodies: ['SUV'] },
  { code: 'BED', name: 'Spray-In Bedliner', price: [450, 650], features: ['Bedliner'], bodies: ['Pickup'] },
  { code: 'CNV', name: 'Convenience Package', price: [700, 1900], features: ['Power Liftgate', 'Wireless Charging', 'Remote Start'] },
]

export const MAKES = Array.from(new Set(MODELS.map((m) => m.make))).sort()
export const BODIES = Array.from(new Set(MODELS.map((m) => m.body))).sort()

/** World manufacturer identifier prefixes, for generating plausible VINs. */
export const WMI: Record<string, string> = {
  Toyota: '4T1', Honda: '1HG', Ford: '1FT', Chevrolet: '1GC', Tesla: '5YJ', BMW: 'WBA', Subaru: '4S4',
  Hyundai: '5NM', Kia: '5XY', Jeep: '1C4', Porsche: 'WP0', Mazda: 'JM3', Rivian: '7PD', Volkswagen: 'WVW',
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export const findModel = (makeSlug: string, modelSlug: string) =>
  MODELS.find((m) => slug(m.make) === slug(makeSlug) && slug(m.model) === slug(modelSlug))
