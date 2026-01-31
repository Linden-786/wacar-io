import { CarListing, SearchParams } from './types'

// Sample data to demonstrate the UI when scrapers don't return results
export function getSampleListings(params: SearchParams): CarListing[] {
  const make = params.makeName || 'Toyota'
  const model = params.modelName || 'Camry'

  const sampleListings: CarListing[] = [
    {
      id: 'sample-1',
      title: `2021 ${make} ${model} SE - Low Miles, Clean Title`,
      price: 24500,
      year: 2021,
      make,
      model,
      mileage: 32000,
      location: 'San Francisco, CA',
      imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=450&fit=crop',
      listingUrl: '#sample',
      source: 'Sample',
      sourceColor: '#6b7280',
      postedDate: '2 days ago',
    },
    {
      id: 'sample-2',
      title: `2020 ${make} ${model} XLE - One Owner`,
      price: 22000,
      year: 2020,
      make,
      model,
      mileage: 45000,
      location: 'Oakland, CA',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=450&fit=crop',
      listingUrl: '#sample',
      source: 'Sample',
      sourceColor: '#6b7280',
      postedDate: '3 days ago',
    },
    {
      id: 'sample-3',
      title: `2022 ${make} ${model} LE - Like New Condition`,
      price: 27500,
      year: 2022,
      make,
      model,
      mileage: 18000,
      location: 'San Jose, CA',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=450&fit=crop',
      listingUrl: '#sample',
      source: 'Sample',
      sourceColor: '#6b7280',
      postedDate: '1 day ago',
    },
    {
      id: 'sample-4',
      title: `2019 ${make} ${model} SE - Well Maintained`,
      price: 19800,
      year: 2019,
      make,
      model,
      mileage: 58000,
      location: 'Berkeley, CA',
      imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=450&fit=crop',
      listingUrl: '#sample',
      source: 'Sample',
      sourceColor: '#6b7280',
      postedDate: '4 days ago',
    },
    {
      id: 'sample-5',
      title: `2023 ${make} ${model} XSE - Loaded`,
      price: 32000,
      year: 2023,
      make,
      model,
      mileage: 8500,
      location: 'Palo Alto, CA',
      imageUrl: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&h=450&fit=crop',
      listingUrl: '#sample',
      source: 'Sample',
      sourceColor: '#6b7280',
      postedDate: 'Today',
    },
    {
      id: 'sample-6',
      title: `2020 ${make} ${model} TRD - Sport Package`,
      price: 25900,
      year: 2020,
      make,
      model,
      mileage: 38000,
      location: 'Mountain View, CA',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=450&fit=crop',
      listingUrl: '#sample',
      source: 'Sample',
      sourceColor: '#6b7280',
      postedDate: '5 days ago',
    },
  ]

  // Filter by price if specified
  let filtered = sampleListings
  if (params.priceMin) {
    filtered = filtered.filter(l => l.price && l.price >= params.priceMin!)
  }
  if (params.priceMax) {
    filtered = filtered.filter(l => l.price && l.price <= params.priceMax!)
  }
  if (params.yearMin) {
    filtered = filtered.filter(l => l.year && l.year >= params.yearMin!)
  }
  if (params.yearMax) {
    filtered = filtered.filter(l => l.year && l.year <= params.yearMax!)
  }

  return filtered
}
