import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Decision Intel — The Reasoning Audit Platform',
    short_name: 'Decision Intel',
    description:
      'The reasoning audit platform. Most tools audit your data; we audit your reasoning — and catch the fatal blind spots in strategic memos before the committee does.',
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
