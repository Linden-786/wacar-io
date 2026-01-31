import { SiteCard } from './site-card'
import { CarSite } from '@/lib/url-generators'

interface SiteGridProps {
  sites: { site: CarSite; url: string }[]
}

export function SiteGrid({ sites }: SiteGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sites.map(({ site, url }) => (
        <SiteCard key={site.id} site={site} url={url} />
      ))}
    </div>
  )
}
