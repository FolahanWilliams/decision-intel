'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { PATTERNS, type PatternId } from '@/lib/data/outreach';

const STORAGE_KEY_CALLS = 'outreach-cmd-discovery-calls-v1';

interface DiscoveryCall {
  id: string;
  company: string;
  contactName: string;
  dateISO: string;
  notes: Record<number, string>;
  patterns: PatternId[];
  summary: string;
}

function readCalls(): DiscoveryCall[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALLS);
    return raw ? (JSON.parse(raw) as DiscoveryCall[]) : [];
  } catch {
    // localStorage / JSON.parse may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
    return [];
  }
}

export function PatternValidationDashboard() {
  const [calls, setCalls] = useState<DiscoveryCall[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration + focus/storage listeners
    setCalls(readCalls());
    // Re-read on focus so cross-tab updates show up.
    const onFocus = () => {
      setCalls(readCalls());
      setTick(t => t + 1);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CALLS) {
        setCalls(readCalls());
        setTick(t => t + 1);
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const counts = useMemo(() => {
    const out: Record<PatternId, { count: number; calls: DiscoveryCall[] }> = {
      A: { count: 0, calls: [] },
      B: { count: 0, calls: [] },
      C: { count: 0, calls: [] },
      D: { count: 0, calls: [] },
    };
    calls.forEach(call => {
      call.patterns.forEach(p => {
        out[p].count += 1;
        out[p].calls.push(call);
      });
    });
    return out;
  }, [calls]);

  const totalCalls = calls.length;
  const validatedCount = PATTERNS.filter(p => counts[p.id].count >= p.threshold).length;

  return (
    <div>
      {/* Summary banner */}
      <div
        style={{
          padding: 14,
          background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(245,158,11,0.04))',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #EC4899',
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <Sparkles size={16} style={{ color: '#EC4899', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#EC4899',
            }}
          >
            Validation status
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: 2,
              lineHeight: 1.35,
            }}
          >
            {validatedCount === 0
              ? `${totalCalls} call${totalCalls === 1 ? '' : 's'} logged · 0 patterns validated yet`
              : `${validatedCount} of 4 patterns validated across ${totalCalls} call${totalCalls === 1 ? '' : 's'}`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {totalCalls < 10
              ? `${10 - totalCalls} more calls to hit the Week 1 target of 10 discovery conversations.`
              : 'Week 1 discovery target hit. Move validated patterns into Week 2 POC recruitment.'}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {PATTERNS.map(pattern => {
          const count = counts[pattern.id].count;
          const isValidated = count >= pattern.threshold;
          const pct = Math.min(100, Math.round((count / pattern.threshold) * 100));
          return (
            <motion.div
              key={pattern.id + tick}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                padding: 14,
                background: isValidated ? `${pattern.color}0d` : 'var(--bg-card)',
                border: `1px solid ${isValidated ? pattern.color : 'var(--border-color)'}`,
                borderLeft: `3px solid ${pattern.color}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: pattern.color,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pattern.id}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: pattern.color,
                    }}
                  >
                    Pattern {pattern.id}
                  </div>
                </div>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: 3,
                    background: isValidated ? pattern.color : 'var(--bg-secondary)',
                    color: isValidated ? '#fff' : 'var(--text-muted)',
                    border: isValidated ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {isValidated ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                  {isValidated ? 'Validated' : `${count}/${pattern.threshold}`}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                  lineHeight: 1.25,
                }}
              >
                {pattern.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                {pattern.description}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'var(--bg-secondary)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    style={{ height: '100%', background: pattern.color }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: pattern.color,
                    minWidth: 26,
                    textAlign: 'right',
                  }}
                >
                  {count}
                </span>
              </div>

              {/* Wedge */}
              <div
                style={{
                  padding: 10,
                  background: `${pattern.color}12`,
                  borderLeft: `2px solid ${pattern.color}`,
                  borderRadius: 4,
                  fontSize: 11,
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                  marginBottom: counts[pattern.id].calls.length > 0 ? 10 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: pattern.color,
                    marginBottom: 3,
                  }}
                >
                  Wedge when validated
                </div>
                {pattern.wedge}
              </div>

              {/* Tagged calls */}
              {counts[pattern.id].calls.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: 5,
                    }}
                  >
                    Tagged by
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {counts[pattern.id].calls.map(call => (
                      <div
                        key={call.id}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-secondary)',
                          borderRadius: 3,
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>{call.contactName}</strong>{' '}
                        · {call.company}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
