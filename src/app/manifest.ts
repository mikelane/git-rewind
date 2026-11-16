import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_CONFIG.name,
    short_name: SITE_CONFIG.shortName,
    description: SITE_CONFIG.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait-primary',
    // Sizes match what src/app/icon.tsx and src/app/apple-icon.tsx render
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    categories: ['developer', 'productivity', 'utilities'],
    prefer_related_applications: false,
  }
}
