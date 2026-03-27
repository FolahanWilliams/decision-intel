'use client';

import { useEffect } from 'react';

/**
 * Reports Web Vitals metrics to the console (and optionally to an analytics endpoint).
 *
 * Tracked metrics: LCP, FID, CLS, TTFB, INP
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ onLCP, onCLS, onTTFB, onINP }) => {
      const reportMetric = (metric: { name: string; value: number; id: string; rating: string }) => {
        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
        }

        // Send to analytics endpoint (fire-and-forget)
        try {
          if (typeof navigator.sendBeacon === 'function') {
            navigator.sendBeacon(
              '/api/admin/vitals',
              JSON.stringify({
                name: metric.name,
                value: metric.value,
                id: metric.id,
                rating: metric.rating,
                url: window.location.pathname,
              })
            );
          }
        } catch {
          // Silently ignore beacon failures
        }
      };

      onLCP(reportMetric);
      onCLS(reportMetric);
      onTTFB(reportMetric);
      onINP(reportMetric);
    }).catch(() => {
      // web-vitals not available — skip silently
    });
  }, []);

  return null;
}
