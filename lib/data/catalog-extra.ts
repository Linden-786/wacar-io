// The wider catalog: every mainstream make and model, described compactly.
// The hand-detailed models in catalog.ts take precedence; these fill in the
// rest of the market with approximate pricing so any car can be searched.
// Line format: name | body | base MSRP ($k) | years | powertrains | weight | seats | trims
//   years: "" = 2016-2026, "2019-" = since 2019, "-2022" = until 2022
//   powertrains: tag:drives, e.g. "t4:FA,hev:A" (F=FWD R=RWD A=AWD 4=4WD)
import type { ModelDef, PowertrainDef } from './catalog'

type PT = Omit<PowertrainDef, 'drives'>
const ice = (engine: string, cyl: number, add: number, trans = 'Automatic'): PT => ({ fuel: 'Gasoline', powertrain: 'ICE', engine, cyl, trans, add })

const TAGS: Record<string, PT> = {
  i3: ice('1.2L I3', 3, 0, 'CVT'),
  t3: ice('1.5L Turbo I3', 3, 0),
  i4: ice('2.5L I4', 4, 0),
  t4: ice('2.0L Turbo I4', 4, 800),
  t5: ice('2.5L Turbo I5', 5, 1500),
  v6: ice('3.6L V6', 6, 2000),
  tv6: ice('3.0L Twin-Turbo V6', 6, 4500),
  i6: ice('3.0L Turbo I6', 6, 4500),
  v8: ice('5.7L V8', 8, 5500),
  tv8: ice('4.0L Twin-Turbo V8', 8, 9000),
  sv8: ice('6.2L Supercharged V8', 8, 12000),
  v10: ice('5.2L V10', 10, 0),
  v12: ice('6.5L V12', 12, 0),
  tv12: ice('6.0L Twin-Turbo V12', 12, 18000),
  h4: ice('2.5L H4', 4, 0, 'CVT'),
  th4: ice('2.4L Turbo H4', 4, 1500),
  h6: ice('4.0L H6', 6, 9000),
  hev: { fuel: 'Hybrid', powertrain: 'HEV', engine: '2.5L I4 Hybrid', cyl: 4, trans: 'CVT', add: 1800 },
  thev: { fuel: 'Hybrid', powertrain: 'HEV', engine: 'Turbo Hybrid', cyl: 4, trans: 'Automatic', add: 3500 },
  phev: { fuel: 'Plug-in Hybrid', powertrain: 'PHEV', engine: 'Plug-in Hybrid', cyl: 4, trans: 'Automatic', add: 7000 },
  bev: { fuel: 'Electric', powertrain: 'BEV', engine: 'Electric', cyl: 0, trans: 'Single-speed', add: 0 },
  fcev: { fuel: 'Hydrogen', powertrain: 'FCEV', engine: 'Fuel Cell', cyl: 0, trans: 'Single-speed', add: 0 },
  dsl: { fuel: 'Diesel', powertrain: 'ICE', engine: '3.0L Turbo Diesel I6', cyl: 6, trans: 'Automatic', add: 4500 },
  dv8: { fuel: 'Diesel', powertrain: 'ICE', engine: '6.7L Turbo Diesel V8', cyl: 8, trans: 'Automatic', add: 9500 },
  di6: { fuel: 'Diesel', powertrain: 'ICE', engine: '6.7L Turbo Diesel I6', cyl: 6, trans: 'Automatic', add: 9500 },
}
const DRIVES: Record<string, string> = { F: 'FWD', R: 'RWD', A: 'AWD', '4': '4WD' }
const SEATS: Record<string, number> = { Sedan: 5, SUV: 5, Pickup: 5, Coupe: 4, Convertible: 4, Hatchback: 5, Wagon: 5, Minivan: 7, Van: 2 }

const TRUCK = ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum']
const CHEVY_TRUCK = ['WT', 'LT', 'LTZ', 'High Country']
const WAGONEER = ['Series I', 'Series II', 'Series III']

function make(name: string, plant: string, country: string, trims: string[], lines: string): ModelDef[] {
  return lines.trim().split('\n').map((line) => {
    const [model, body, base, years, pts, weight, seats, ownTrims] = line.split('|').map((s) => s.trim())
    const [from, to] = years ? years.split('-').map((y) => (y ? Number(y) : 0)) : [0, 0]
    const first = from || 2016, last = to || 2026
    const defs = pts.split(',').map((spec) => {
      const [tag, drives] = spec.split(':')
      const manual = tag.endsWith('m') && !TAGS[tag]
      const pt = TAGS[manual ? tag.slice(0, -1) : tag]
      if (!pt) throw new Error(`Unknown powertrain "${tag}" for ${name} ${model}`)
      return { ...pt, trans: manual ? 'Manual' : pt.trans, drives: drives.split('').map((d) => DRIVES[d]) }
    })
    const floor = defs[0].add
    const ladder = ownTrims ? ownTrims.split(',').map((t) => t.trim()) : trims
    const price = Number(base) * 1000
    return {
      make: name, model, body,
      seats: seats ? Number(seats) : SEATS[body] ?? 5,
      doors: body === 'Coupe' || body === 'Convertible' ? 2 : 4,
      base: price,
      gens: [{ name: first === last ? String(first) : `${first}–${last}`, from: first, to: last }],
      trims: ladder.map((t, i) => ({ name: t, add: Math.round((price * 0.085 * i * (1 + 0.12 * i)) / 100) * 100 })),
      pts: defs.map((d) => ({ ...d, add: Math.max(0, d.add - floor) })),
      plant, country,
      weight: Number(weight),
    }
  })
}

const US = 'United States'

export const EXTRA_MODELS: ModelDef[] = [
  ...make('Acura', 'Marysville, OH', US, ['Base', 'Technology', 'A-Spec', 'Advance'], `
ILX|Sedan|28|-2022|i4:F|1
Integra|Hatchback|33|2023-|t4:F,t4m:F|1.5
MDX|SUV|52||v6:FA|3|7
NSX|Coupe|160|2017-2022|tv6:A|0.08|2|Base
RDX|SUV|46||t4:FA|2.5
TLX|Sedan|46||t4:FA,tv6:A|1.5
ZDX|SUV|65|2024-2025|bev:RA|0.4`),
  ...make('Alfa Romeo', 'Cassino, IT', 'Italy', ['Sprint', 'Ti', 'Veloce', 'Quadrifoglio'], `
Giulia|Sedan|45|2017-|t4:RA,tv6:R|0.6
Stelvio|SUV|48|2018-|t4:A,tv6:A|0.7
Tonale|SUV|38|2024-|phev:A,t4:A|0.4||Sprint,Ti,Veloce`),
  ...make('Aston Martin', 'Gaydon, UK', 'United Kingdom', ['Base'], `
Vantage|Coupe|195|2019-|tv8:R|0.06|2
DB11|Coupe|220|2017-2023|tv8:R,tv12:R|0.05
DB12|Coupe|250|2024-|tv8:R|0.04
DBX|SUV|200|2021-|tv8:A|0.08`),
  ...make('Audi', 'Ingolstadt, DE', 'Germany', ['Premium', 'Premium Plus', 'Prestige'], `
A3|Sedan|39||t4:FA|1
A4|Sedan|45|-2025|t4:FA|1.8
A5|Coupe|49||t4:A|1.2
A6|Sedan|59||t4:A,tv6:A|1
A7|Hatchback|73||tv6:A|0.5
A8|Sedan|92||tv6:A,tv8:A|0.3
e-tron|SUV|72|2019-2023|bev:A|0.5
e-tron GT|Sedan|108|2022-|bev:A|0.2
Q3|SUV|40||t4:A|2
Q4 e-tron|SUV|51|2022-|bev:RA|0.8
Q5|SUV|47||t4:A,phev:A|4
Q7|SUV|62||t4:A,tv6:A|2|7
Q8|SUV|76|2019-|tv6:A|1
R8|Coupe|162|2017-2023|v10:RA|0.06|2|Base,Performance
RS 3|Sedan|64|2017-|t5:A|0.15||Base
RS 5|Coupe|80|2018-2025|tv6:A|0.15||Base
RS 6|Wagon|128|2021-|tv8:A|0.12||Base,Performance
RS 7|Hatchback|130|2021-|tv8:A|0.1||Base,Performance
S3|Sedan|49||t4:A|0.3
S4|Sedan|56|-2025|tv6:A|0.4
S5|Coupe|60||tv6:A|0.4
TT|Coupe|54|-2023|t4:A|0.2`),
  ...make('Bentley', 'Crewe, UK', 'United Kingdom', ['Base', 'Azure', 'Speed'], `
Continental GT|Coupe|245||tv8:A,tv12:A|0.06
Flying Spur|Sedan|220||tv8:A,tv12:A|0.04
Bentayga|SUV|205|2017-|tv8:A|0.08`),
  ...make('BMW', 'Dingolfing, DE', 'Germany', ['Base', 'Convenience', 'Premium', 'M Sport'], `
2 Series|Coupe|40||t4:RA,i6:RA|0.8
4 Series|Coupe|52||t4:RA,i6:RA|1.2
5 Series|Sedan|60||t4:RA,i6:A,phev:A|1.8
7 Series|Sedan|98||i6:RA,tv8:A|0.5
8 Series|Coupe|92|2019-|i6:RA,tv8:A|0.2
i4|Sedan|54|2022-|bev:RA|0.8
i5|Sedan|68|2024-|bev:RA|0.4
i7|Sedan|107|2023-|bev:A|0.2
iX|SUV|89|2022-|bev:A|0.5
M2|Coupe|66||i6:R,i6m:R|0.25||Base,Competition
M4|Coupe|82||i6:RA,i6m:R|0.35||Base,Competition
M5|Sedan|115||tv8:A|0.2||Base,Competition
M8|Coupe|140|2020-2025|tv8:A|0.08||Competition
X1|SUV|42||t4:FA|1.8
X2|SUV|44|2018-|t4:FA|0.6
X3|SUV|51||t4:RA,i6:A|3.5
X4|SUV|57|-2025|t4:A,i6:A|0.6
X6|SUV|76||i6:A,tv8:A|0.6
X7|SUV|86|2019-|i6:A,tv8:A|1.2|7
Z4|Convertible|56|2019-|t4:R,i6:R|0.25|2`),
  ...make('Buick', 'Lansing, MI', US, ['Preferred', 'Sport Touring', 'Avenir'], `
Enclave|SUV|47||v6:FA|1.5|7
Encore|SUV|25|-2022|t4:FA|1
Encore GX|SUV|27|2020-|t3:FA|2
Envision|SUV|38||t4:FA|1
Envista|SUV|25|2024-|t3:F|1.2`),
  ...make('Cadillac', 'Lansing, MI', US, ['Luxury', 'Premium Luxury', 'Sport'], `
CT4|Sedan|36|2020-|t4:RA|0.6
CT5|Sedan|49|2020-|t4:RA,tv6:RA|0.8
CT5-V Blackwing|Sedan|97|2022-|sv8:R,sv8m:R|0.1||Base
Escalade|SUV|90||v8:R4,dsl:R4|1.5|7|Luxury,Premium Luxury,Sport,Platinum
Lyriq|SUV|60|2023-|bev:RA|0.8
XT4|SUV|41|2019-|t4:FA|1
XT5|SUV|46|2017-|t4:FA,v6:FA|1.8
XT6|SUV|51|2020-|v6:FA|0.8|7`),
  ...make('Chevrolet', 'Lansing, MI', US, ['LS', 'LT', 'RS', 'Premier'], `
Blazer|SUV|37|2019-|t4:FA,v6:FA|2
Blazer EV|SUV|46|2024-|bev:FA|0.6||LT,RS,SS
Bolt EV|Hatchback|28|2017-2023|bev:F|1||1LT,2LT
Bolt EUV|SUV|29|2022-2023|bev:F|0.6||LT,Premier
Camaro|Coupe|32|-2024|t4:R,v6:R,v8:R,v8m:R|1.5||1LS,1LT,2LT,1SS,2SS,ZL1
Colorado|Pickup|33||t4:R4|2||WT,LT,Z71,ZR2
Equinox EV|SUV|35|2024-|bev:FA|0.8||LT,RS
Malibu|Sedan|27|-2025|t4:F|2.5
Silverado 2500HD|Pickup|47||v8:R4,dv8:4|2||${CHEVY_TRUCK.join(',')}
Silverado 3500HD|Pickup|49||v8:R4,dv8:4|0.8||${CHEVY_TRUCK.join(',')}
Silverado EV|Pickup|58|2024-|bev:4|0.3||WT,LT,RST
Suburban|SUV|62||v8:R4,dsl:R4|1.5|8|LS,LT,RST,Z71,Premier,High Country
Trailblazer|SUV|25|2021-|t3:FA|2||LS,LT,ACTIV,RS
Traverse|SUV|39||v6:FA|2.5|8
Trax|SUV|22||t3:F|2.5||LS,1RS,LT,2RS,ACTIV`),
  ...make('Chrysler', 'Windsor, ON', 'Canada', ['Touring', 'Touring L', 'Limited', 'Pinnacle'], `
300|Sedan|36|-2023|v6:RA,v8:R|1||Touring,Touring L,300S,300C
Pacifica|Minivan|43|2017-|v6:FA,phev:F|2
Voyager|Minivan|40|2020-|v6:F|0.4||LX`),
  ...make('Dodge', 'Brampton, ON', 'Canada', ['SXT', 'GT', 'R/T', 'Scat Pack'], `
Challenger|Coupe|33|-2023|v6:RA,v8:R,v8m:R|2||SXT,GT,R/T,Scat Pack,SRT Hellcat
Charger|Sedan|35|-2023|v6:RA,v8:R|2||SXT,GT,R/T,Scat Pack,SRT Hellcat
Durango|SUV|42||v6:RA,v8:A|2|7|SXT,GT,R/T,Citadel
Hornet|SUV|33|2023-2025|t4:A,phev:A|0.6||GT,R/T`),
  ...make('Ferrari', 'Maranello, IT', 'Italy', ['Base'], `
296 GTB|Coupe|340|2022-|phev:R|0.03|2
F8 Tributo|Coupe|280|2020-2023|tv8:R|0.03|2
Portofino|Convertible|230|2018-2023|tv8:R|0.03
Purosangue|SUV|430|2023-|v12:A|0.02|4
Roma|Coupe|250|2021-|tv8:R|0.04
SF90 Stradale|Coupe|530|2021-2025|phev:A|0.02|2`),
  ...make('Fiat', 'Toluca, MX', 'Mexico', ['Pop', 'Lounge', 'Sport'], `
500|Hatchback|18|-2019|i4:F,i4m:F|0.3|4
500e|Hatchback|34|2024-|bev:F|0.15|4|Base,Inspired By Music,Inspired By Beauty
500X|SUV|30|-2023|t4:A|0.3||Pop,Trekking,Sport`),
  ...make('Ford', 'Louisville, KY', US, ['Active', 'ST-Line', 'Platinum'], `
Bronco Sport|SUV|31|2021-|t3:4,t4:4|2.5||Big Bend,Outer Banks,Badlands
Edge|SUV|39|-2024|t4:FA,tv6:A|2.5||SE,SEL,ST-Line,Titanium,ST
Escape|SUV|30||t3:FA,hev:FA,phev:F|4
Expedition|SUV|62||tv6:R4|1.8|8|XLT,Limited,King Ranch,Platinum
Explorer|SUV|41||t4:R4,tv6:4,hev:R4|4.5|7|Active,ST-Line,Platinum,ST
F-150 Lightning|Pickup|55|2022-|bev:4|0.6||Pro,XLT,Flash,Lariat,Platinum
F-250|Pickup|46||v8:R4,dv8:4|2.5||${TRUCK.join(',')}
F-350|Pickup|48||v8:R4,dv8:4|1.2||${TRUCK.join(',')}
Maverick|Pickup|27|2022-|hev:FA,t4:FA|1.8||XL,XLT,Lariat
Ranger|Pickup|34|2019-|t4:R4|1.5||XL,XLT,Lariat,Raptor
Transit|Van|48||v6:RA|0.8||XL,XLT`),
  ...make('Genesis', 'Ulsan, KR', 'South Korea', ['Standard', 'Advanced', 'Prestige'], `
G70|Sedan|43|2019-|t4:RA,tv6:RA|0.6
G80|Sedan|56|2017-|t4:RA,tv6:A|0.6
G90|Sedan|90|2017-|tv6:A|0.15
GV60|SUV|53|2023-|bev:RA|0.3
GV70|SUV|46|2022-|t4:A,tv6:A,bev:A|1.2
GV80|SUV|59|2021-|t4:A,tv6:A|1`),
  ...make('GMC', 'Fort Wayne, IN', US, ['SLE', 'SLT', 'AT4', 'Denali'], `
Acadia|SUV|44||t4:FA|2|7
Canyon|Pickup|38||t4:R4|1||Elevation,AT4,Denali,AT4X
Hummer EV|Pickup|99|2022-|bev:4|0.15||2X,3X
Sierra 1500|Pickup|39||t4:R4,v8:R4,dsl:R4|5||Pro,SLE,Elevation,SLT,AT4,Denali
Sierra 2500HD|Pickup|48||v8:R4,dv8:4|1.5||Pro,SLE,SLT,AT4,Denali
Terrain|SUV|31||t4:FA|2
Yukon|SUV|60||v8:R4,dsl:R4|2.2|8
Yukon XL|SUV|63||v8:R4|0.8|8`),
  ...make('Honda', 'Lincoln, AL', US, ['LX', 'EX', 'EX-L', 'Touring'], `
Fit|Hatchback|17|-2020|i4:F,i4m:F|1||LX,Sport,EX,EX-L
HR-V|SUV|26||i4:FA|3.5||LX,Sport,EX-L
Odyssey|Minivan|42||v6:F|2.5|8|EX,EX-L,Sport,Touring,Elite
Passport|SUV|44|2019-|v6:FA|1.5||EX-L,TrailSport,Black Edition
Prologue|SUV|48|2024-|bev:FA|0.8||EX,Touring,Elite
Ridgeline|Pickup|41|2017-|v6:A|1.2||Sport,RTL,TrailSport,Black Edition`),
  ...make('Hyundai', 'Montgomery, AL', US, ['SE', 'SEL', 'Limited'], `
Elantra|Sedan|23||i4:F,hev:F|4||SE,SEL,N Line,Limited
Ioniq 6|Sedan|39|2023-|bev:RA|0.6
Kona|SUV|26|2018-|i4:FA,t4:FA,bev:F|3||SE,SEL,N Line,Limited
Palisade|SUV|39|2020-|v6:FA|3|8|SE,SEL,XRT,Limited,Calligraphy
Santa Cruz|Pickup|30|2022-|i4:FA,t4:A|0.8||SE,SEL,XRT,Limited
Santa Fe|SUV|36||i4:FA,t4:FA,hev:A|3.5||SE,SEL,XRT,Limited,Calligraphy
Sonata|Sedan|28||i4:F,hev:F|2.5||SE,SEL,N Line,Limited
Veloster|Hatchback|21|-2022|i4:F,t4m:F|0.4|4|Base,Premium,N
Venue|SUV|21|2020-|i4:F|1`),
  ...make('Infiniti', 'Tochigi, JP', 'Japan', ['Pure', 'Luxe', 'Sensory', 'Autograph'], `
Q50|Sedan|44|-2024|tv6:RA|1.2||Pure,Luxe,Sensory,Red Sport 400
Q60|Coupe|51|2017-2022|tv6:RA|0.3||Pure,Luxe,Red Sport 400
QX50|SUV|42|2019-2025|t4:FA|1
QX55|SUV|51|2022-2025|t4:A|0.3||Luxe,Essential,Sensory
QX60|SUV|51||v6:FA|1.8|7
QX80|SUV|84||v8:R4|0.6|7|Luxe,Premium Select,Sensory`),
  ...make('Jaguar', 'Castle Bromwich, UK', 'United Kingdom', ['S', 'SE', 'R-Dynamic'], `
E-PACE|SUV|50|2018-2024|t4:A|0.3
F-PACE|SUV|58|2017-|t4:A,i6:A|0.7||S,SE,R-Dynamic,SVR
F-TYPE|Coupe|79|-2024|t4:R,sv8:A|0.2|2|P300,R-Dynamic,R
I-PACE|SUV|73|2019-2024|bev:A|0.2||S,SE,HSE
XE|Sedan|48|2017-2020|t4:RA|0.2
XF|Sedan|51|-2024|t4:RA|0.25`),
  ...make('Jeep', 'Belvidere, IL', US, ['Sport', 'Latitude', 'Limited', 'Trailhawk'], `
Cherokee|SUV|35|-2023|i4:F4,v6:F4|3||Latitude,Altitude,Limited,Trailhawk
Compass|SUV|28|2017-|i4:F4,t4:4|3
Gladiator|Pickup|40|2020-|v6:4,v6m:4|2||Sport,Willys,Mojave,Rubicon
Grand Cherokee L|SUV|44|2021-|v6:R4,v8:4|2|7|Laredo,Altitude,Limited,Overland,Summit
Grand Wagoneer|SUV|93|2022-|tv6:4|0.3|7|${WAGONEER.join(',')}
Renegade|SUV|29|-2023|t4:F4|1.5
Wagoneer|SUV|64|2022-|tv6:R4|0.7|8|${WAGONEER.join(',')}`),
  ...make('Kia', 'West Point, GA', US, ['LX', 'EX', 'SX'], `
Carnival|Minivan|37|2022-|v6:F,hev:F|1.5|8|LX,EX,SX,SX Prestige
EV6|SUV|44|2022-|bev:RA|1||Light,Wind,GT-Line,GT
EV9|SUV|56|2024-|bev:RA|0.6|7|Light,Wind,Land,GT-Line
Forte|Sedan|21|-2024|i4:F|3||LX,LXS,GT-Line,GT
K5|Sedan|28|2021-|t4:FA|2||LXS,GT-Line,EX,GT
Niro|SUV|28|2017-|hev:F,phev:F,bev:F|1.5
Optima|Sedan|24|-2020|i4:F|1.5
Seltos|SUV|26|2021-|i4:FA,t4:A|2||LX,S,EX,X-Line,SX
Sorento|SUV|33||i4:FA,t4:FA,hev:FA|3.5|7|LX,S,EX,SX,SX Prestige
Soul|Hatchback|21||i4:F|2||LX,S,GT-Line,EX
Stinger|Hatchback|38|2018-2023|t4:RA,tv6:RA|0.5||GT-Line,GT1,GT2`),
  ...make('Lamborghini', "Sant'Agata Bolognese, IT", 'Italy', ['Base'], `
Aventador|Coupe|420|-2022|v12:A|0.02|2
Huracán|Coupe|250|-2024|v10:RA|0.05|2
Revuelto|Coupe|610|2024-|phev:A|0.01|2
Urus|SUV|240|2019-|tv8:A|0.1`),
  ...make('Land Rover', 'Solihull, UK', 'United Kingdom', ['S', 'SE', 'HSE', 'Autobiography'], `
Defender|SUV|58|2020-|t4:4,i6:4,sv8:4|1||S,SE,X-Dynamic,X,V8
Discovery|SUV|61|2017-|t4:4,i6:4|0.4|7|S,SE,HSE
Discovery Sport|SUV|49||t4:4|0.5||S,SE,HSE
Range Rover|SUV|109||i6:4,tv8:4,phev:4|0.8||SE,HSE,Autobiography,SV
Range Rover Evoque|SUV|51||t4:4|0.6||S,SE,HSE
Range Rover Sport|SUV|85||i6:4,tv8:4,phev:4|1.2||SE,HSE,Autobiography,SV
Range Rover Velar|SUV|63|2018-|t4:4,i6:4|0.5||S,SE,HSE`),
  ...make('Lexus', 'Tahara, JP', 'Japan', ['Base', 'Premium', 'F Sport', 'Luxury'], `
ES|Sedan|44||v6:F,hev:F,i4:A|3
GX|SUV|66||v8:4,tv6:4|1.2|7|Premium,Overtrail,Luxury
IS|Sedan|42||t4:R,v6:RA,v8:R|1.5
LC|Coupe|100|2018-|v8:R,hev:R|0.1||Base
LS|Sedan|82||tv6:RA,hev:RA|0.3||Base,F Sport,Luxury
LX|SUV|95||v8:4,tv6:4|0.4|7|Premium,F Sport,Luxury,Ultra Luxury
NX|SUV|42||t4:FA,hev:A,phev:A|3
RC|Coupe|47|-2025|t4:R,v6:RA,v8:R|0.4||Base,F Sport
RX|SUV|51||v6:FA,hev:A,t4:FA|5
RZ|SUV|56|2023-|bev:FA|0.3||Premium,Luxury
TX|SUV|57|2024-|t4:FA,hev:A|1|7|Base,Premium,Luxury
UX|SUV|38|2019-|hev:FA,i4:F|1||Base,Premium,F Sport`),
  ...make('Lincoln', 'Chicago, IL', US, ['Premiere', 'Reserve', 'Black Label'], `
Aviator|SUV|60|2020-|tv6:RA,phev:A|1.2|7
Corsair|SUV|41|2020-|t4:FA,phev:A|1.5
MKC|SUV|35|-2019|t4:FA|0.6||Premiere,Select,Reserve
MKZ|Sedan|38|-2020|t4:FA,hev:F|0.8||Premiere,Select,Reserve
Nautilus|SUV|53|2019-|t4:FA,tv6:A,hev:A|1.5
Navigator|SUV|86||tv6:R4|0.8|7`),
  ...make('Lotus', 'Hethel, UK', 'United Kingdom', ['Base'], `
Eletre|SUV|110|2024-|bev:A|0.02
Emira|Coupe|100|2023-|t4:R,v6m:R|0.04|2
Evora|Coupe|98|2017-2021|v6:R,v6m:R|0.02`),
  ...make('Lucid', 'Casa Grande, AZ', US, ['Pure', 'Touring', 'Grand Touring', 'Sapphire'], `
Air|Sedan|71|2022-|bev:RA|0.4
Gravity|SUV|81|2025-|bev:A|0.1|7|Touring,Grand Touring`),
  ...make('Maserati', 'Modena, IT', 'Italy', ['GT', 'Modena', 'Trofeo'], `
Ghibli|Sedan|85|-2024|tv6:RA,tv8:R|0.3
GranTurismo|Coupe|160|2024-|tv6:A,bev:A|0.04||Modena,Trofeo,Folgore
Grecale|SUV|70|2023-|t4:A,tv6:A|0.25
Levante|SUV|92|2017-2024|tv6:A,tv8:A|0.35
MC20|Coupe|240|2022-|tv6:R|0.03|2|Base
Quattroporte|Sedan|110|-2024|tv6:RA|0.08`),
  ...make('Mazda', 'Hiroshima, JP', 'Japan', ['Select', 'Preferred', 'Premium', 'Premium Plus'], `
CX-30|SUV|26|2020-|i4:FA,t4:A|3
CX-50|SUV|31|2023-|i4:A,t4:A,hev:A|2.5
CX-70|SUV|42|2025-|i6:A,phev:A|0.5
CX-9|SUV|40|-2023|t4:FA|1.5|7|Sport,Touring,Grand Touring,Signature
CX-90|SUV|39|2024-|i6:A,phev:A|1.5|7
Mazda3|Sedan|25||i4:FA,i4m:F,t4:A|2.5
Mazda6|Sedan|26|-2021|i4:F,t4:F|1||Sport,Touring,Grand Touring,Signature`),
  ...make('McLaren', 'Woking, UK', 'United Kingdom', ['Base'], `
570S|Coupe|195|-2021|tv8:R|0.03|2
720S|Coupe|310|2018-2023|tv8:R|0.03|2
Artura|Coupe|255|2023-|phev:R|0.02|2
GT|Coupe|215|2020-2024|tv8:R|0.02|2`),
  ...make('Mercedes-Benz', 'Sindelfingen, DE', 'Germany', ['Base', 'Premium', 'Exclusive', 'Pinnacle'], `
A-Class|Sedan|35|2019-2022|t4:FA|0.5
AMG GT|Coupe|140||tv8:RA|0.1||Base
C-Class|Sedan|49||t4:RA|3
CLA|Sedan|45||t4:FA|1
CLE|Coupe|58|2024-|t4:A,i6:A|0.4
E-Class|Sedan|64||t4:RA,i6:A|2
EQB|SUV|54|2022-|bev:FA|0.4|7
EQE|Sedan|76|2023-|bev:RA|0.4
EQS|Sedan|105|2022-|bev:RA|0.3
G-Class|SUV|148||tv8:4|0.3||G 550,AMG G 63
GLA|SUV|44||t4:FA|1.5
GLB|SUV|46|2020-|t4:FA|1.2|7
GLC|SUV|51||t4:RA,phev:A|4
GLE|SUV|63||t4:RA,i6:A,phev:A|3.5
GLS|SUV|89|2017-|i6:A,tv8:A|1|7
Maybach S-Class|Sedan|200|2021-|tv8:A,tv12:A|0.03||Base
Metris|Van|40|-2023|t4:R|0.2||Base
S-Class|Sedan|118||i6:A,tv8:A|0.6
SL|Convertible|112|2022-|t4:R,tv8:A|0.12||Base
Sprinter|Van|52||dsl:R4|0.6||Base`),
  ...make('MINI', 'Oxford, UK', 'United Kingdom', ['Classic', 'Signature', 'Iconic'], `
Clubman|Wagon|35|-2024|t4:FA|0.3
Convertible|Convertible|36||t4:F|0.2
Cooper|Hatchback|30||t3:F,t4:F,t4m:F|0.8|4
Countryman|SUV|39||t4:FA|0.7`),
  ...make('Mitsubishi', 'Okazaki, JP', 'Japan', ['ES', 'SE', 'SEL'], `
Eclipse Cross|SUV|28|2018-|t4:FA|1
Mirage|Hatchback|18|2017-2024|i3:F|0.8
Outlander|SUV|30||i4:FA,phev:A|2|7
Outlander Sport|SUV|25||i4:FA|1.2`),
  ...make('Nissan', 'Smyrna, TN', US, ['S', 'SV', 'SL', 'Platinum'], `
370Z|Coupe|31|-2020|v6:R,v6m:R|0.2|2|Base,Sport,Nismo
Altima|Sedan|28||i4:FA|4||S,SV,SR,SL
Ariya|SUV|41|2023-|bev:FA|0.6||Engage,Evolve+,Platinum+
Armada|SUV|58|2017-|v8:R4|0.8|8
Frontier|Pickup|33||v6:R4|2||S,SV,PRO-4X
Kicks|SUV|23|2018-|i4:FA|2.5||S,SV,SR
LEAF|Hatchback|29||bev:F|0.8||S,SV Plus
Maxima|Sedan|39|-2023|v6:F|1||SV,SR,Platinum
Murano|SUV|41||v6:FA|2
Pathfinder|SUV|38||v6:F4|2.5|7
Rogue|SUV|30||i4:FA,t3:FA|7
Rogue Sport|SUV|25|2017-2022|i4:FA|1.5||S,SV,SL
Sentra|Sedan|22||i4:F|4||S,SV,SR
Titan|Pickup|47|-2024|v8:R4|0.8||SV,PRO-4X,Platinum Reserve
Versa|Sedan|18||i4:F,i4m:F|2||S,SV,SR
Z|Coupe|44|2023-|tv6:R,tv6m:R|0.25|2|Sport,Performance,Nismo`),
  ...make('Polestar', 'Chengdu, CN', 'China', ['Base', 'Plus', 'Performance'], `
Polestar 2|Hatchback|51|2021-|bev:RA|0.4
Polestar 3|SUV|75|2025-|bev:A|0.1`),
  ...make('Porsche', 'Zuffenhausen, DE', 'Germany', ['Base', 'S', 'GTS', 'Turbo'], `
718 Boxster|Convertible|74|2017-|th4:R,th4m:R,h6:R|0.15|2|Base,S,GTS 4.0
718 Cayman|Coupe|72|2017-|th4:R,th4m:R,h6:R|0.15|2|Base,S,GTS 4.0,GT4
Cayenne|SUV|86||tv6:A,tv8:A,phev:A|1.2
Panamera|Sedan|104|2017-|tv6:RA,tv8:A,phev:A|0.3|4
Taycan|Sedan|100|2020-|bev:RA|0.4|4|Base,4S,GTS,Turbo,Turbo S`),
  ...make('Ram', 'Sterling Heights, MI', US, ['Tradesman', 'Big Horn', 'Laramie', 'Limited'], `
1500|Pickup|42||v6:R4,v8:R4,dsl:R4|7||Tradesman,Big Horn,Laramie,Rebel,Limited,TRX
2500|Pickup|48||v8:R4,di6:4|2
3500|Pickup|50||v8:R4,di6:4|0.8
ProMaster|Van|46||v6:F|0.8||Tradesman,SLT`),
  ...make('Rivian', 'Normal, IL', US, ['Adventure', 'Ascend'], `
R1T|Pickup|71|2022-|bev:A|0.5`),
  ...make('Rolls-Royce', 'Goodwood, UK', 'United Kingdom', ['Base', 'Black Badge'], `
Cullinan|SUV|410|2019-|tv12:A|0.04
Ghost|Sedan|355||tv12:A|0.03
Phantom|Sedan|500|2018-|tv12:R|0.015||Base
Spectre|Coupe|425|2024-|bev:A|0.015
Wraith|Coupe|345|-2023|tv12:R|0.02`),
  ...make('Subaru', 'Lafayette, IN', US, ['Base', 'Premium', 'Sport', 'Limited', 'Touring'], `
Ascent|SUV|40|2019-|th4:A|2|8|Premium,Onyx Edition,Limited,Touring
BRZ|Coupe|32||h4:R,h4m:R|0.4||Premium,Limited,tS
Forester|SUV|31||h4:A|5
Impreza|Hatchback|25||h4:A|1.5||Base,Sport,RS
Legacy|Sedan|26|-2025|h4:A,th4:A|1.2
Solterra|SUV|40|2023-|bev:A|0.4||Premium,Limited,Touring
WRX|Sedan|34||th4:A,th4m:A|1||Base,Premium,Limited,tS`),
  ...make('Tesla', 'Fremont, CA', US, ['All-Wheel Drive', 'Plaid'], `
Cybertruck|Pickup|80|2024-|bev:A|0.4||All-Wheel Drive,Cyberbeast
Model S|Sedan|80||bev:A|0.8
Model X|SUV|85||bev:A|0.7|7`),
  ...make('Toyota', 'Georgetown, KY', US, ['LE', 'XLE', 'Limited', 'Platinum'], `
Avalon|Sedan|37|-2022|v6:F,hev:F|0.8||XLE,XSE,Limited,Touring
bZ4X|SUV|39|2023-|bev:FA|0.6||XLE,Limited
C-HR|SUV|25|2018-2022|i4:F|0.8||LE,XLE,Limited
Corolla|Sedan|23||i4:F,hev:FA|6||LE,SE,XLE,XSE
Corolla Cross|SUV|25|2022-|i4:FA,hev:A|3||L,LE,XLE
Crown|Sedan|42|2023-|hev:A,thev:A|0.6||XLE,Limited,Platinum
GR Corolla|Hatchback|40|2023-|t3m:A|0.15||Core,Premium,Circuit Edition
GR Supra|Coupe|47|2020-|t4:R,i6:R,i6m:R|0.25|2|2.0,3.0,3.0 Premium
GR86|Coupe|31|2022-|h4:R,h4m:R|0.4||Base,Premium
Grand Highlander|SUV|42|2024-|t4:FA,hev:A|1.8|8
Highlander|SUV|41||v6:FA,t4:FA,hev:A|5.5|8
Land Cruiser|SUV|58||v8:4,thev:4|0.4||1958,Land Cruiser,First Edition
Mirai|Sedan|51||fcev:R|0.05||XLE,Limited
Sequoia|SUV|64||v8:R4,thev:R4|0.8|8|SR5,Limited,Platinum,TRD Pro,Capstone
Sienna|Minivan|40||v6:FA,hev:FA|2.5|8
Tundra|Pickup|42||v8:R4,tv6:R4,thev:4|3||SR,SR5,Limited,Platinum,1794 Edition,TRD Pro
Venza|SUV|36|2021-2024|hev:A|0.8||LE,XLE,Limited`),
  ...make('Volkswagen', 'Chattanooga, TN', US, ['S', 'SE', 'SEL'], `
Arteon|Sedan|44|2019-2024|t4:FA|0.3||SE,SEL R-Line,SEL Premium
Atlas|SUV|39|2018-|t4:FA,v6:FA|2.5|7
Atlas Cross Sport|SUV|38|2020-|t4:FA|1.2
Golf|Hatchback|24|-2021|t4:F,t4m:F|0.6
Golf R|Hatchback|47||t4:A,t4m:A|0.15||Base
ID. Buzz|Minivan|61|2025-|bev:RA|0.1|7|Pro S,Pro S Plus
ID.4|SUV|41|2021-|bev:RA|1||Standard,Pro,Pro S
Jetta|Sedan|23||t4:F,t4m:F|3||S,Sport,SE,SEL,GLI
Passat|Sedan|28|-2022|t4:F|1
Taos|SUV|26|2022-|t4:FA|1.5
Tiguan|SUV|30||t4:FA|3||S,SE,SE R-Line,SEL R-Line`),
  ...make('Volvo', 'Torslanda, SE', 'Sweden', ['Core', 'Plus', 'Ultimate'], `
C40 Recharge|SUV|54|2022-2025|bev:RA|0.2
EX30|SUV|46|2025-|bev:RA|0.15
EX90|SUV|81|2025-|bev:A|0.1|7|Plus,Ultra
S60|Sedan|43||t4:FA,phev:A|0.6
S90|Sedan|59|2017-|t4:A,phev:A|0.25
V60|Wagon|51|2019-|t4:A,phev:A|0.2
V90|Wagon|60|2018-|t4:A|0.1
XC40|SUV|41|2019-|t4:FA|1.5
XC40 Recharge|SUV|53|2021-2025|bev:RA|0.3
XC60|SUV|48||t4:FA,phev:A|2.2
XC90|SUV|58||t4:A,phev:A|1.8|7`),
]

/** World manufacturer identifier prefixes for the makes added here. */
export const EXTRA_WMI: Record<string, string> = {
  Acura: '19U', 'Alfa Romeo': 'ZAR', 'Aston Martin': 'SCF', Audi: 'WAU', Bentley: 'SCB', Buick: '1G4', Cadillac: '1G6',
  Chrysler: '2C4', Dodge: '2C3', Ferrari: 'ZFF', Fiat: '3C3', Genesis: 'KMT', GMC: '1GT', Infiniti: 'JN1', Jaguar: 'SAJ',
  Lamborghini: 'ZHW', 'Land Rover': 'SAL', Lexus: 'JTH', Lincoln: '5LM', Lotus: 'SCC', Lucid: '50E', Maserati: 'ZAM',
  McLaren: 'SBM', 'Mercedes-Benz': 'W1K', MINI: 'WMW', Mitsubishi: 'JA4', Nissan: '1N4', Polestar: 'LPS', Ram: '1C6',
  'Rolls-Royce': 'SCA', Volvo: 'YV4',
}

/** Makes whose cars hold value unusually well and are often sold above sticker. */
export const EXOTIC = new Set(['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Bentley', 'Rolls-Royce', 'Lotus', 'Porsche'])
