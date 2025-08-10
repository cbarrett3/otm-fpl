// Description: Simple static sitemap entries for primary pages.
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://fpldraftkit.com'
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/compare`, lastModified: now },
    { url: `${base}/rankings`, lastModified: now },
    { url: `${base}/predicted`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
  ]
}


