import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Decision Intel — AI Cognitive Bias Detection',
    short_name: 'Decision Intel',
    description:
      'Detect cognitive bias and decision noise in strategic documents. AI-powered audits for M&A, PE/VC, and investment committees.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#16A34A',
    icons: [
      {
        src: '/logo-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
