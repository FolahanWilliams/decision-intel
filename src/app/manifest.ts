import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Decision Intel — Reasoning Layer for Boardroom Decisions',
    short_name: 'Decision Intel',
    description:
      'The native reasoning layer for every boardroom strategic decision. Audit every strategic memo, simulate steering-committee objections, and compound your team’s judgment quarter after quarter.',
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
