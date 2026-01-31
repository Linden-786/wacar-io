'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { makes, getModelsByMake, bodyTypes } from '@/lib/vehicle-data'
import { Search } from 'lucide-react'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 35 }, (_, i) => currentYear + 1 - i)

const priceOptions = [
  { value: '5000', label: '$5,000' },
  { value: '10000', label: '$10,000' },
  { value: '15000', label: '$15,000' },
  { value: '20000', label: '$20,000' },
  { value: '25000', label: '$25,000' },
  { value: '30000', label: '$30,000' },
  { value: '40000', label: '$40,000' },
  { value: '50000', label: '$50,000' },
  { value: '75000', label: '$75,000' },
  { value: '100000', label: '$100,000' },
  { value: '150000', label: '$150,000' },
  { value: '200000', label: '$200,000+' },
]

const mileageOptions = [
  { value: '10000', label: '10,000 miles' },
  { value: '25000', label: '25,000 miles' },
  { value: '50000', label: '50,000 miles' },
  { value: '75000', label: '75,000 miles' },
  { value: '100000', label: '100,000 miles' },
  { value: '150000', label: '150,000 miles' },
  { value: '200000', label: '200,000+ miles' },
]

const radiusOptions = [
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
  { value: '100', label: '100 miles' },
  { value: '150', label: '150 miles' },
  { value: '200', label: '200 miles' },
  { value: '300', label: '300 miles' },
  { value: '500', label: '500 miles' },
  { value: 'nationwide', label: 'Nationwide' },
]

export function SearchForm() {
  const router = useRouter()
  const [selectedMake, setSelectedMake] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [yearMin, setYearMin] = useState<string>('')
  const [yearMax, setYearMax] = useState<string>('')
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [mileageMax, setMileageMax] = useState<string>('')
  const [zipCode, setZipCode] = useState<string>('')
  const [radius, setRadius] = useState<string>('100')
  const [bodyType, setBodyType] = useState<string>('')
  const [condition, setCondition] = useState<string>('all')

  const models = selectedMake ? getModelsByMake(selectedMake) : []
  const selectedMakeData = makes.find((m) => m.id === selectedMake)
  const selectedModelData = models.find((m) => m.id === selectedModel)

  // Reset model when make changes
  useEffect(() => {
    setSelectedModel('')
  }, [selectedMake])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()

    if (selectedMake) params.set('make', selectedMake)
    if (selectedMakeData) params.set('makeName', selectedMakeData.name)
    if (selectedModel) params.set('model', selectedModel)
    if (selectedModelData) params.set('modelName', selectedModelData.name)
    if (yearMin) params.set('yearMin', yearMin)
    if (yearMax) params.set('yearMax', yearMax)
    if (priceMin) params.set('priceMin', priceMin)
    if (priceMax) params.set('priceMax', priceMax)
    if (mileageMax) params.set('mileageMax', mileageMax)
    if (zipCode) params.set('zipCode', zipCode)
    if (radius && radius !== 'nationwide') params.set('radius', radius)
    if (bodyType) params.set('bodyType', bodyType)
    if (condition && condition !== 'all') params.set('condition', condition)

    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Select value={selectedMake} onValueChange={setSelectedMake}>
            <SelectTrigger id="make">
              <SelectValue placeholder="Any Make" />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {make.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={!selectedMake}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder={selectedMake ? 'Any Model' : 'Select make first'} />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="yearMin">Min Year</Label>
          <Select value={yearMin} onValueChange={setYearMin}>
            <SelectTrigger id="yearMin">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearMax">Max Year</Label>
          <Select value={yearMax} onValueChange={setYearMax}>
            <SelectTrigger id="yearMax">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priceMin">Min Price</Label>
          <Select value={priceMin} onValueChange={setPriceMin}>
            <SelectTrigger id="priceMin">
              <SelectValue placeholder="No Min" />
            </SelectTrigger>
            <SelectContent>
              {priceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priceMax">Max Price</Label>
          <Select value={priceMax} onValueChange={setPriceMax}>
            <SelectTrigger id="priceMax">
              <SelectValue placeholder="No Max" />
            </SelectTrigger>
            <SelectContent>
              {priceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mileageMax">Max Mileage</Label>
          <Select value={mileageMax} onValueChange={setMileageMax}>
            <SelectTrigger id="mileageMax">
              <SelectValue placeholder="Any Mileage" />
            </SelectTrigger>
            <SelectContent>
              {mileageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bodyType">Body Type</Label>
          <Select value={bodyType} onValueChange={setBodyType}>
            <SelectTrigger id="bodyType">
              <SelectValue placeholder="Any Body Type" />
            </SelectTrigger>
            <SelectContent>
              {bodyTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            type="text"
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            maxLength={5}
            pattern="[0-9]{5}"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="radius">Search Radius</Label>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger id="radius">
              <SelectValue placeholder="100 miles" />
            </SelectTrigger>
            <SelectContent>
              {radiusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger id="condition">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" size="lg">
        <Search className="mr-2 h-4 w-4" />
        Search All Sites
      </Button>
    </form>
  )
}
