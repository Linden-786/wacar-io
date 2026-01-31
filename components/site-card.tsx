import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CarSite } from '@/lib/url-generators'

interface SiteCardProps {
  site: CarSite
  url: string
}

export function SiteCard({ site, url }: SiteCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: site.color }}
          >
            {site.name.charAt(0)}
          </div>
          <h3 className="font-semibold text-lg">{site.name}</h3>
          <Button asChild className="w-full" variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Search on {site.name}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
