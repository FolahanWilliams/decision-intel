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
        background: 'rgba(8, 8, 8, 0.95)',
        backdropFilter: 'blur(48px) saturate(160%)',
        WebkitBackdropFilter: 'blur(48px) saturate(160%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 1px 0 rgba(255, 255, 255, 0.03) inset',
      }}
    >
      <div className="ticker-track" style={{ flex: 1 }}>
        <TickerItem label="Avg Quality" value={stats.avgScore} color="#FFFFFF" />
        <TickerItem label="Avg Noise" value={stats.avgNoise} color="#d4d4d8" />
        <TickerItem label="Documents" value={stats.totalDocs} color="#a1a1aa" />
        <TickerItem label="Analyzed" value={stats.analyzedDocs} color="#FFFFFF" />
        <TickerItem label="Status" value="Operational" color="#22c55e" />
        {/* Duplicate for seamless marquee loop */}
        <TickerItem label="Avg Quality" value={stats.avgScore} color="#FFFFFF" />
        <TickerItem label="Avg Noise" value={stats.avgNoise} color="#d4d4d8" />
        <TickerItem label="Documents" value={stats.totalDocs} color="#a1a1aa" />
        <TickerItem label="Analyzed" value={stats.analyzedDocs} color="#FFFFFF" />
        <TickerItem label="Status" value="Operational" color="#22c55e" />
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
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (max-width: 640px) {
          .ticker-track {
            gap: 24px;
            animation-duration: 18s;
          }
        }
      `}</style>
    </div>
  );
}

function TickerItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: color || 'var(--text-muted)',
          flexShrink: 0,
        }}
      />
      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{label}</span>
      <span
        style={{
          color: color || 'var(--text-highlight)',
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
