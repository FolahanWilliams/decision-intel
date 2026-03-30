'use client';

import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load Swagger UI from CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      if (containerRef.current && window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: '/api/v1/openapi',
          domNode: containerRef.current,
          deepLinking: true,
          presets: [window.SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '8px',
          color: 'var(--text-primary)',
        }}
      >
        API Documentation
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Decision Intelligence REST API v1. Authenticate with a Bearer token starting with{' '}
        <code
          style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '13px',
          }}
        >
          di_live_
        </code>
        . Create keys in Settings &rarr; API Keys.
      </p>
      <div ref={containerRef} />
    </div>
  );
}

// Extend Window for Swagger UI global
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SwaggerUIBundle: any;
  }
}
