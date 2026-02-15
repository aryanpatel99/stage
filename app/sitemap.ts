import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://screenshot-studio.com'
  const lastModified = new Date()

  return [
    // Homepage / Landing
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Editor (main product)
    {
      url: `${baseUrl}/home`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Landing page
    {
      url: `${baseUrl}/landing`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}

