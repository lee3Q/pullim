import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://pullim.vercel.app', lastModified: new Date(), priority: 1 },
    { url: 'https://pullim.vercel.app/history', lastModified: new Date(), priority: 0.5 },
  ]
}
