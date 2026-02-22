'use client';

export default function Ticker() {
    return (
        <div
            role="marquee"
            aria-label="System metrics ticker"
            style={{
                background: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-color)',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px'
            }}
        >
            <div className="ticker-track">
                <TickerItem label="AVG DECISION SCORE" value="85.4" change="+2.1%" up />
                <TickerItem label="NOISE INDEX" value="42.0" change="-1.5%" down />
                <TickerItem label="BIAS DETECTED" value="12" change="+3" bad />
                <TickerItem label="SYSTEM STATUS" value="OPERATIONAL" />
                <TickerItem label="DOCUMENTS PROCESSED" value="1,240" />
                <TickerItem label="AVG DECISION SCORE" value="85.4" change="+2.1%" up />
                <TickerItem label="NOISE INDEX" value="42.0" change="-1.5%" down />
                <TickerItem label="BIAS DETECTED" value="12" change="+3" bad />
                <TickerItem label="SYSTEM STATUS" value="OPERATIONAL" />
                <TickerItem label="DOCUMENTS PROCESSED" value="1,240" />
            </div>
            <style jsx>{`
                .ticker-track {
                    display: flex;
                    gap: 32px;
                    animation: slide 20s linear infinite;
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
    const color = up || down ? 'var(--success)' : bad ? 'var(--error)' : 'var(--text-primary)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>{value}</span>
            {change && (
                <span style={{ color }} aria-label={`Change: ${change}`}>{change}</span>
            )}
        </div>
    );
}
