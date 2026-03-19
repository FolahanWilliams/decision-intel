'use client';

import { Skeleton } from '@/components/ui/skeleton';

/** Standardized page-level loading skeleton */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
      {/* Header skeleton */}
      <div className="flex items-center gap-md mb-xl">
        <Skeleton className="h-6 w-6" />
        <div>
          <Skeleton className="h-5 w-[200px] mb-1.5" />
          <Skeleton className="h-3.5 w-[120px]" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-4 mb-xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <Skeleton className="h-3 w-[60%] mb-2" />
            <Skeleton className="h-6 w-[40%]" />
          </div>
        ))}
      </div>

      {/* Content rows skeleton */}
      <div className="card">
        <div className="card-header">
          <Skeleton className="h-3.5 w-[140px]" />
        </div>
        <div className="card-body">
          {[...Array(rows)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-md"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}
            >
              <Skeleton className="h-8 w-8" />
              <div className="flex-1">
                <Skeleton
                  className="h-3.5 mb-1"
                  style={{ width: `${60 + ((i * 7) % 30)}%` }}
                />
                <Skeleton
                  className="h-3"
                  style={{ width: `${30 + ((i * 13) % 20)}%` }}
                />
              </div>
              <Skeleton className="h-5 w-[60px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compact card-level skeleton */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      <div className="card-body">
        {[...Array(lines)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-3.5 mb-2"
            style={{ width: `${60 + ((i * 11) % 35)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for chart/gauge visualizations */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="card card-glow h-full">
      <div className="card-header">
        <Skeleton className="h-3.5 w-[120px]" />
      </div>
      <div className="card-body flex items-center justify-center" style={{ minHeight: height }}>
        <Skeleton className="w-[80%] h-[70%]" />
      </div>
    </div>
  );
}

/** Skeleton for treemap visualizations */
export function TreemapSkeleton() {
  return (
    <div className="card card-glow h-full">
      <div className="card-header flex items-center justify-between">
        <Skeleton className="h-3.5 w-[100px]" />
        <Skeleton className="h-3.5 w-[60px]" />
      </div>
      <div
        className="card-body"
        style={{
          height: 'clamp(240px, 30vw, 360px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '8px',
          padding: '16px',
        }}
      >
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="w-full h-full" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for gauge/radial visualizations */
export function GaugeSkeleton({ size = 120 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <Skeleton style={{ width: size, height: size }} />
      <Skeleton className="h-3.5 w-[80px] mt-2" />
    </div>
  );
}

/** Skeleton for a full dashboard layout: 4 KPI cards + 3 chart cards */
export function DashboardSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
      {/* 4 KPI card skeletons */}
      <div className="grid grid-4 mb-xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <Skeleton className="h-3 w-[80px] mb-2" />
            <Skeleton className="h-8 w-[100px] mb-1" />
            <Skeleton className="h-3 w-[60px]" />
          </div>
        ))}
      </div>

      {/* 3 chart card skeletons */}
      <div className="grid grid-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card card-glow h-full">
            <div className="card-header">
              <Skeleton className="h-3.5 w-[120px]" />
            </div>
            <div className="card-body flex items-center justify-center" style={{ minHeight: 240 }}>
              <Skeleton className="w-[80%] h-[160px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
