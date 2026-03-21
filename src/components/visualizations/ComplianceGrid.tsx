'use client';

interface ComplianceGridProps {
  data: { name: string; pass: number; warn: number; fail: number }[];
}

const STATUS_CONFIG = {
  pass: { label: 'Pass', colorClass: 'text-success', bgClass: 'bg-success/10', icon: '✓' },
  warn: { label: 'Warn', colorClass: 'text-warning', bgClass: 'bg-warning/10', icon: '⚠' },
  fail: { label: 'Fail', colorClass: 'text-error', bgClass: 'bg-error/10', icon: '✕' },
};

const STATUS_DOT: Record<string, string> = {
  pass: 'bg-success',
  warn: 'bg-warning',
  fail: 'bg-error',
};

export function ComplianceGrid({ data }: ComplianceGridProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-[13px]">Compliance Scorecard</h3>
        </div>
        <div className="card-body flex items-center justify-center min-h-[120px]">
          <p className="text-muted text-sm">No compliance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-[13px]">Compliance Scorecard</h3>
      </div>
      <div className="card-body !p-0">
        {/* Header row - hidden on mobile, shown on sm+ */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] text-xs border-b border-border px-4 py-2.5 text-muted font-semibold">
          <span>Regulation</span>
          <span className="text-center">Pass</span>
          <span className="text-center">Warn</span>
          <span className="text-center">Fail</span>
        </div>

        {/* Data rows */}
        {data.map((reg, i) => {
          const dominant = reg.fail > 0 ? 'fail' : reg.warn > 0 ? 'warn' : 'pass';

          return (
            <div
              key={i}
              className={`${
                i < data.length - 1 ? 'border-b border-border' : ''
              } ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
            >
              {/* Desktop: grid layout */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] px-4 py-2.5 items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 ${STATUS_DOT[dominant]}`}
                    aria-label={`Overall status: ${STATUS_CONFIG[dominant].label}`}
                  />
                  <span className="text-[13px] font-medium">{reg.name}</span>
                </div>
                {(['pass', 'warn', 'fail'] as const).map(status => (
                  <div key={status} className="text-center">
                    {reg[status] > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONFIG[status].bgClass} ${STATUS_CONFIG[status].colorClass}`}
                        aria-label={`${STATUS_CONFIG[status].label}: ${reg[status]}`}
                      >
                        <span aria-hidden="true">{STATUS_CONFIG[status].icon}</span>
                        {reg[status]}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile: stacked card layout */}
              <div className="sm:hidden px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 ${STATUS_DOT[dominant]}`}
                    aria-label={`Overall status: ${STATUS_CONFIG[dominant].label}`}
                  />
                  <span className="text-[13px] font-medium">{reg.name}</span>
                </div>
                <div className="flex items-center gap-3 pl-4">
                  {(['pass', 'warn', 'fail'] as const).map(status => (
                    <div key={status}>
                      {reg[status] > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONFIG[status].bgClass} ${STATUS_CONFIG[status].colorClass}`}
                          aria-label={`${STATUS_CONFIG[status].label}: ${reg[status]}`}
                        >
                          <span aria-hidden="true">{STATUS_CONFIG[status].icon}</span>
                          {reg[status]} {STATUS_CONFIG[status].label}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">{STATUS_CONFIG[status].label}: —</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
