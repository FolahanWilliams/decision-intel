'use client';

interface ComplianceGridProps {
  data: { name: string; pass: number; warn: number; fail: number }[];
}

const STATUS_CONFIG = {
  pass: { label: 'Pass', colorClass: 'text-success', bgClass: 'bg-success/10' },
  warn: { label: 'Warn', colorClass: 'text-warning', bgClass: 'bg-warning/10' },
  fail: { label: 'Fail', colorClass: 'text-error', bgClass: 'bg-error/10' },
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
        {/* Header row */}
        <div className="grid grid-cols-[1fr_70px_70px_70px] text-xs border-b border-border px-4 py-2.5 text-muted font-semibold">
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
              className={`grid grid-cols-[1fr_70px_70px_70px] px-4 py-2.5 items-center ${
                i < data.length - 1 ? 'border-b border-border' : ''
              } ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${STATUS_DOT[dominant]}`} />
                <span className="text-[13px] font-medium">{reg.name}</span>
              </div>
              {(['pass', 'warn', 'fail'] as const).map(status => (
                <div key={status} className="text-center">
                  {reg[status] > 0 ? (
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONFIG[status].bgClass} ${STATUS_CONFIG[status].colorClass}`}
                    >
                      {reg[status]}
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
