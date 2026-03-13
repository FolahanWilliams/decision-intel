'use client';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBlock({ className = '', style }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`} role="status" aria-label="Loading" style={style} />
  );
}

/** Standardized page-level loading skeleton */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
      {/* Header skeleton */}
      <div className="flex items-center gap-md mb-xl">
        <SkeletonBlock style={{ width: '24px', height: '24px' }} />
        <div>
          <SkeletonBlock style={{ width: '200px', height: '20px', marginBottom: '6px' }} />
          <SkeletonBlock style={{ width: '120px', height: '14px' }} />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-4 mb-xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <SkeletonBlock style={{ width: '60%', height: '12px', marginBottom: '8px' }} />
            <SkeletonBlock style={{ width: '40%', height: '24px' }} />
          </div>
        ))}
      </div>

      {/* Content rows skeleton */}
      <div className="card">
        <div className="card-header">
          <SkeletonBlock style={{ width: '140px', height: '14px' }} />
        </div>
        <div className="card-body">
          {[...Array(rows)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-md"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}
            >
              <SkeletonBlock style={{ width: '32px', height: '32px' }} />
              <div style={{ flex: 1 }}>
                <SkeletonBlock
                  style={{ width: `${60 + ((i * 7) % 30)}%`, height: '14px', marginBottom: '4px' }}
                />
                <SkeletonBlock style={{ width: `${30 + ((i * 13) % 20)}%`, height: '12px' }} />
              </div>
              <SkeletonBlock style={{ width: '60px', height: '20px' }} />
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
          <SkeletonBlock
            key={i}
            style={{ width: `${60 + ((i * 11) % 35)}%`, height: '14px', marginBottom: '8px' }}
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
        <SkeletonBlock style={{ width: '120px', height: '13px' }} />
      </div>
      <div className="card-body flex items-center justify-center" style={{ minHeight: height }}>
        <SkeletonBlock style={{ width: '80%', height: '70%' }} />
      </div>
    </div>
  );
}

/** Skeleton for treemap visualizations */
export function TreemapSkeleton() {
  return (
    <div className="card card-glow h-full">
      <div className="card-header flex items-center justify-between">
        <SkeletonBlock style={{ width: '100px', height: '13px' }} />
        <SkeletonBlock style={{ width: '60px', height: '13px' }} />
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
          <SkeletonBlock key={i} style={{ width: '100%', height: '100%' }} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for gauge/radial visualizations */
export function GaugeSkeleton({ size = 120 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <SkeletonBlock style={{ width: size, height: size }} />
      <SkeletonBlock style={{ width: '80px', height: '14px', marginTop: '8px' }} />
    </div>
  );
}

export { SkeletonBlock };
