'use client';

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

function SkeletonBlock({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            role="status"
            aria-label="Loading"
            style={{
                borderRadius: 0,
                ...style,
            }}
        />
    );
}

/** Standardized page-level loading skeleton matching the terminal aesthetic */
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
                        <div key={i} className="flex items-center gap-md" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <SkeletonBlock style={{ width: '32px', height: '32px' }} />
                            <div style={{ flex: 1 }}>
                                <SkeletonBlock style={{ width: `${60 + (i * 7) % 30}%`, height: '14px', marginBottom: '4px' }} />
                                <SkeletonBlock style={{ width: `${30 + (i * 13) % 20}%`, height: '12px' }} />
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
                    <SkeletonBlock key={i} style={{ width: `${60 + (i * 11) % 35}%`, height: '14px', marginBottom: '8px' }} />
                ))}
            </div>
        </div>
    );
}

export { SkeletonBlock };
