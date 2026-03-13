'use client';

import { useState, useEffect } from 'react';
import { NotificationBell } from '@/components/ui/NotificationCenter';

interface TickerStats {
  avgScore: string;
  avgNoise: string;
  totalDocs: string;
  analyzedDocs: string;
}

const DEFAULTS: TickerStats = {
  avgScore: '—',
  avgNoise: '—',
  totalDocs: '—',
  analyzedDocs: '—',
};

export default function Ticker() {
  const [stats, setStats] = useState<TickerStats>(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.overview) return;
        const o = data.overview;
        setStats({
          avgScore: o.avgOverallScore != null ? String(o.avgOverallScore) : '—',
          avgNoise: o.avgNoiseScore != null ? String(o.avgNoiseScore) : '—',
          totalDocs: o.totalDocuments != null ? String(o.totalDocuments) : '—',
          analyzedDocs: o.documentsAnalyzed != null ? String(o.documentsAnalyzed) : '—',
        });
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      role="marquee"
      aria-label="System metrics"
      style={{
        background: 'var(--liquid-bg-strong)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: '1px solid var(--liquid-border)',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 1px 0 var(--liquid-specular) inset',
      }}
    >
      <div className="ticker-track" style={{ flex: 1 }}>
        <TickerItem label="Avg Quality" value={stats.avgScore} />
        <TickerItem label="Avg Noise" value={stats.avgNoise} />
        <TickerItem label="Documents" value={stats.totalDocs} />
        <TickerItem label="Analyzed" value={stats.analyzedDocs} />
        <TickerItem label="Status" value="Operational" />
        {/* Duplicate for seamless marquee loop */}
        <TickerItem label="Avg Quality" value={stats.avgScore} />
        <TickerItem label="Avg Noise" value={stats.avgNoise} />
        <TickerItem label="Documents" value={stats.totalDocs} />
        <TickerItem label="Analyzed" value={stats.analyzedDocs} />
        <TickerItem label="Status" value="Operational" />
      </div>
      <div style={{ flexShrink: 0, padding: '0 12px', zIndex: 10 }}>
        <NotificationBell />
      </div>
      <style jsx>{`
        .ticker-track {
          display: flex;
          gap: 40px;
          animation: slide 25s linear infinite;
          padding-left: 20px;
        }
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function TickerItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{label}</span>
      <span
        style={{
          color: 'var(--text-highlight)',
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
        }}
      >
        {value}
      </span>
    </div>
  );
}
