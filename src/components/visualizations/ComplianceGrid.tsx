'use client';

interface ComplianceGridProps {
    data: { name: string; pass: number; warn: number; fail: number }[];
}

const STATUS_CONFIG = {
    pass: { label: 'PASS', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
    warn: { label: 'WARN', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
    fail: { label: 'FAIL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export function ComplianceGrid({ data }: ComplianceGridProps) {
    if (!data || data.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Compliance Scorecard
                    </h3>
                </div>
                <div className="card-body flex items-center justify-center" style={{ height: 120 }}>
                    <p className="text-muted text-sm">No compliance data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Compliance Scorecard
                </h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `1fr repeat(3, 70px)`,
                    fontSize: '11px',
                    borderBottom: '1px solid var(--border-color)',
                    padding: '8px 16px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                }}>
                    <span>Regulation</span>
                    <span style={{ textAlign: 'center' }}>Pass</span>
                    <span style={{ textAlign: 'center' }}>Warn</span>
                    <span style={{ textAlign: 'center' }}>Fail</span>
                </div>
                {data.map((reg, i) => {
                    const dominant = reg.fail > 0 ? 'fail' : reg.warn > 0 ? 'warn' : 'pass';
                    const config = STATUS_CONFIG[dominant];

                    return (
                        <div
                            key={i}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `1fr repeat(3, 70px)`,
                                padding: '10px 16px',
                                borderBottom: i < data.length - 1 ? '1px solid var(--border-color)' : 'none',
                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: config.color,
                                    boxShadow: `0 0 6px ${config.color}40`,
                                }} />
                                <span style={{ fontSize: '12px', fontWeight: 500 }}>{reg.name}</span>
                            </div>
                            {(['pass', 'warn', 'fail'] as const).map(status => (
                                <div key={status} style={{ textAlign: 'center' }}>
                                    {reg[status] > 0 ? (
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            background: STATUS_CONFIG[status].bg,
                                            color: STATUS_CONFIG[status].color,
                                        }}>
                                            {reg[status]}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
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
