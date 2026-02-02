'use client';

import { useEffect, useState } from 'react';

export default function Ticker() {
    return (
        <div style={{
            background: '#1a1a1a',
            borderBottom: '1px solid #333',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px'
        }}>
            <div className="ticker-track">
                {/* Simulated Ticker Items */}
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
    const color = up || down ? '#30d158' : bad ? '#ff453a' : '#e0e0e0';
    // If down is true (meaning noise reduction), it's good (green). If bad is true (bias increase), it's red.
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#888' }}>{label}</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{value}</span>
            {change && (
                <span style={{ color }}>{change}</span>
            )}
        </div>
    )
}
