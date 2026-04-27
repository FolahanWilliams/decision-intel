'use client';

import { useState, useCallback } from 'react';
import { TrendingUp, Plus, Trash2, BarChart2 } from 'lucide-react';

const STORAGE_KEY = 'founder-content-performance';

interface PerformanceEntry {
  id: string;
  postTitle: string;
  platform: 'LinkedIn' | 'Twitter/X' | 'Newsletter' | 'Blog';
  pillar: string;
  likes: number;
  comments: number;
  reposts: number;
  impressions: number;
  loggedAt: string;
}

const PLATFORMS: PerformanceEntry['platform'][] = ['LinkedIn', 'Twitter/X', 'Newsletter', 'Blog'];
const PILLAR_OPTIONS = [
  { value: 'decision_science', label: 'Decision Science' },
  { value: 'founder_journey', label: 'Founder Journey' },
  { value: 'enterprise_ai', label: 'Enterprise AI' },
  { value: 'market_insight', label: 'Market Insights' },
  { value: 'social_proof', label: 'Social Proof' },
];

function computeStats(entries: PerformanceEntry[]) {
  if (entries.length === 0) return null;

  const totalImpressions = entries.reduce((s, e) => s + e.impressions, 0);
  const avgLikes = Math.round(entries.reduce((s, e) => s + e.likes, 0) / entries.length);

  // Best platform by avg engagement rate (likes+comments+reposts / impressions)
  const byPlatform: Record<string, { total: number; count: number }> = {};
  for (const e of entries) {
    const eng = e.likes + e.comments * 2 + e.reposts * 3;
    const rate = e.impressions > 0 ? eng / e.impressions : 0;
    if (!byPlatform[e.platform]) byPlatform[e.platform] = { total: 0, count: 0 };
    byPlatform[e.platform].total += rate;
    byPlatform[e.platform].count += 1;
  }
  const bestPlatform =
    Object.entries(byPlatform).sort(
      ([, a], [, b]) => b.total / b.count - a.total / a.count
    )[0]?.[0] ?? '—';

  // Best pillar by avg likes
  const byPillar: Record<string, { likes: number; count: number }> = {};
  for (const e of entries) {
    if (!byPillar[e.pillar]) byPillar[e.pillar] = { likes: 0, count: 0 };
    byPillar[e.pillar].likes += e.likes;
    byPillar[e.pillar].count += 1;
  }
  const bestPillarKey =
    Object.entries(byPillar).sort(
      ([, a], [, b]) => b.likes / b.count - a.likes / a.count
    )[0]?.[0] ?? '—';
  const bestPillar = PILLAR_OPTIONS.find(p => p.value === bestPillarKey)?.label ?? bestPillarKey;

  return { totalImpressions, avgLikes, bestPlatform, bestPillar, count: entries.length };
}

const emptyForm = {
  postTitle: '',
  platform: 'LinkedIn' as PerformanceEntry['platform'],
  pillar: 'decision_science',
  likes: 0,
  comments: 0,
  reposts: 0,
  impressions: 0,
};

export function ContentPerformanceWidget() {
  const [entries, setEntries] = useState<PerformanceEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      // localStorage / JSON.parse may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
      return [];
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const save = useCallback((next: PerformanceEntry[]) => {
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (!form.postTitle.trim()) return;
    const entry: PerformanceEntry = {
      id: crypto.randomUUID(),
      ...form,
      loggedAt: new Date().toISOString(),
    };
    save([entry, ...entries]);
    setForm(emptyForm);
    setShowForm(false);
  }, [form, entries, save]);

  const handleDelete = useCallback(
    (id: string) => {
      save(entries.filter(e => e.id !== id));
    },
    [entries, save]
  );

  const stats = computeStats(entries);

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 12,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    width: '100%',
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginTop: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Content Performance
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            outcome loop — log weekly
          </span>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            background: showForm ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
            border: 'none',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Log Post
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { label: 'Posts Logged', value: stats.count },
            { label: 'Avg Likes', value: stats.avgLikes },
            { label: 'Best Platform', value: stats.bestPlatform },
            { label: 'Best Pillar', value: stats.bestPillar },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                }}
              >
                {String(s.value)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Log Form */}
      {showForm && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <input
                placeholder="Post title or first line…"
                value={form.postTitle}
                onChange={e => setForm(p => ({ ...p, postTitle: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <select
              value={form.platform}
              onChange={e =>
                setForm(p => ({ ...p, platform: e.target.value as PerformanceEntry['platform'] }))
              }
              style={inputStyle}
            >
              {PLATFORMS.map(pl => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
            <select
              value={form.pillar}
              onChange={e => setForm(p => ({ ...p, pillar: e.target.value }))}
              style={inputStyle}
            >
              {PILLAR_OPTIONS.map(pl => (
                <option key={pl.value} value={pl.value}>
                  {pl.label}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 10,
            }}
          >
            {(['likes', 'comments', 'reposts', 'impressions'] as const).map(field => (
              <div key={field}>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginBottom: 3,
                    textTransform: 'capitalize',
                  }}
                >
                  {field}
                </div>
                <input
                  type="number"
                  min={0}
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAdd}
              disabled={!form.postTitle.trim()}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: form.postTitle.trim() ? 1 : 0.5,
              }}
            >
              Save Entry
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 && !showForm && (
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={14} style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Log your post stats once a week — after 3–4 weeks the best-performing pillars and
            platforms emerge.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.slice(0, 8).map(entry => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.postTitle}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {entry.platform} · {PILLAR_OPTIONS.find(p => p.value === entry.pillar)?.label}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                <span>👍 {entry.likes}</span>
                <span>💬 {entry.comments}</span>
                <span>🔁 {entry.reposts}</span>
                {entry.impressions > 0 && <span>👁 {entry.impressions.toLocaleString()}</span>}
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: 'var(--text-muted)',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
