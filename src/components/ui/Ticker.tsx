'use client';

export default function Ticker() {
    return (
        <div
            role="marquee"
            aria-label="System metrics"
            style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--glass-border)',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <div className="ticker-track">
                <TickerItem label="Decision Score" value="85.4" change="+2.1%" up />
                <TickerItem label="Noise Index" value="42.0" change="-1.5%" down />
                <TickerItem label="Biases Detected" value="12" change="+3" bad />
                <TickerItem label="Status" value="Operational" />
                <TickerItem label="Documents" value="1,240" />
                <TickerItem label="Decision Score" value="85.4" change="+2.1%" up />
                <TickerItem label="Noise Index" value="42.0" change="-1.5%" down />
                <TickerItem label="Biases Detected" value="12" change="+3" bad />
                <TickerItem label="Status" value="Operational" />
                <TickerItem label="Documents" value="1,240" />
            </div>
            <style jsx>{`
                .ticker-track {
                    display: flex;
                    gap: 40px;
                    animation: slide 25s linear infinite;
                    padding-left: 20px;
                }
                @keyframes slide {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}

function TickerItem({ label, value, change, up, down, bad }: { label: string, value: string, change?: string, up?: boolean, down?: boolean, bad?: boolean }) {
    const changeColor = up ? 'var(--success)' : down ? 'var(--success)' : bad ? 'var(--error)' : 'var(--text-muted)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{label}</span>
            <span style={{
                color: 'var(--text-highlight)',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
            }}>{value}</span>
            {change && (
                <span style={{
                    color: changeColor,
                    fontSize: '11px',
                    fontWeight: 500,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: bad ? 'rgba(239, 68, 68, 0.1)' : up || down ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    padding: '1px 6px',
                    borderRadius: '4px',
                }} aria-label={`Change: ${change}`}>{change}</span>
            )}
        </div>
    );
}
