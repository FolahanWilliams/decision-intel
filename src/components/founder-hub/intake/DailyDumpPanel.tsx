'use client';

import { useMemo, useState } from 'react';
import {
  Mic,
  Sparkles,
  Send,
  Trash2,
  Check,
  Loader2,
  Target,
  CheckCircle2,
  Moon,
  Sun,
  GraduationCap,
  Users,
  UserPlus,
  ArrowRightCircle,
  CalendarRange,
  ListPlus,
  BookHeart,
  BookOpen,
  ClipboardCheck,
  NotebookPen,
  type LucideIcon,
} from 'lucide-react';
import {
  INTAKE_ACTION_META,
  INTAKE_CLUSTERS,
  type ProposedAction,
  type FieldSpec,
  type FieldValue,
} from '@/lib/founder-hub/intake/intake-actions';
import {
  resolvePick,
  isActionReady,
  type IntakeContext,
} from '@/lib/founder-hub/intake/intake-parse';

interface Props {
  founderPass?: string;
  /** Called after a successful log batch so sibling surfaces can refresh. */
  onLogged?: () => void;
}

const ICONS: Record<string, LucideIcon> = {
  Target,
  CheckCircle2,
  Moon,
  Sun,
  GraduationCap,
  Users,
  UserPlus,
  ArrowRightCircle,
  CalendarRange,
  ListPlus,
  BookHeart,
  BookOpen,
  ClipboardCheck,
  NotebookPen,
};
const ACCENT: Record<string, string> = {
  primary: 'var(--accent-primary)',
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warning)',
};

function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Phase = 'input' | 'review';

export function DailyDumpPanel({ founderPass, onLogged }: Props) {
  const pass = founderPass ?? process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS ?? '';
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': pass }),
    [pass]
  );
  const [today] = useState(() => localDay());

  const [phase, setPhase] = useState<Phase>('input');
  const [dump, setDump] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ProposedAction[]>([]);
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const [logging, setLogging] = useState(false);
  const [results, setResults] = useState<Record<string, { ok: boolean; error?: string }>>({});

  const live = actions.filter(a => !dropped.has(a.id));
  const readyCount = live.filter(isActionReady).length;
  const doneCount = Object.values(results).filter(r => r.ok).length;

  async function fetchContext(): Promise<IntakeContext> {
    try {
      const [gRes, pRes, tRes] = await Promise.all([
        fetch('/api/founder-os/daily-goals?days=2', { cache: 'no-store', headers }),
        fetch('/api/founder-hub/outreach/prospects', { cache: 'no-store', headers }),
        fetch('/api/founder-hub/todos', { cache: 'no-store', headers }),
      ]);
      const gBody = await gRes.json().catch(() => null);
      const pBody = await pRes.json().catch(() => null);
      const tBody = await tRes.json().catch(() => null);
      const openGoals = (
        (gBody?.data?.goals as { id: string; text: string; status: string; date: string }[]) ?? []
      )
        .filter(g => g.status === 'open' && g.date === today)
        .map(g => ({ id: g.id, text: g.text }));
      const prospects = (
        (pBody?.data?.prospects as {
          id: string;
          name: string;
          company: string | null;
          stage: string;
        }[]) ?? []
      )
        .filter(p => p.stage !== 'converted' && p.stage !== 'lost')
        .map(p => ({ id: p.id, name: p.name, company: p.company ?? null, stage: p.stage }));
      const openTodos = (
        (tBody?.data?.todos as { id: string; title: string; done: boolean }[] | undefined) ?? []
      )
        .filter(t => !t.done)
        .map(t => ({ id: t.id, title: t.title }));
      return { openGoals, prospects, openTodos };
    } catch {
      // canonical fire-and-forget — degrade to empty context (matching still works on names)
      return { openGoals: [], prospects: [], openTodos: [] };
    }
  }

  async function parse() {
    if (dump.trim().length < 4) return;
    setParsing(true);
    setError(null);
    try {
      const context = await fetchContext();
      const res = await fetch('/api/founder-hub/intake/parse', {
        method: 'POST',
        headers,
        body: JSON.stringify({ dump: dump.trim(), context }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error || 'Could not parse — try again.');
        return;
      }
      const parsed = (body?.data?.actions as ProposedAction[]) ?? [];
      if (body?.data?.usedMock) {
        setError('AI key not configured in this environment — parsing is unavailable here.');
        return;
      }
      if (parsed.length === 0) {
        setError('Nothing actionable found in that dump. Add more specifics and re-parse.');
        return;
      }
      setActions(parsed);
      setDropped(new Set());
      setResults({});
      setPhase('review');
    } catch {
      setError('Network error — try again.');
    } finally {
      setParsing(false);
    }
  }

  function setField(id: string, key: string, value: FieldValue) {
    setActions(prev =>
      prev.map(a => (a.id === id ? { ...a, fields: { ...a.fields, [key]: value } } : a))
    );
  }
  function pick(id: string, targetId: string) {
    setActions(prev => prev.map(a => (a.id === id ? resolvePick(a, targetId) : a)));
  }

  async function execAction(a: ProposedAction): Promise<{ ok: boolean; error?: string }> {
    const meta = INTAKE_ACTION_META[a.type];
    const req = meta.toRequest(a, { today, nowIso: new Date().toISOString() });
    try {
      const res = await fetch(req.path, {
        method: req.method,
        headers,
        body: JSON.stringify(req.body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        return { ok: false, error: b?.error || `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }

  async function logConfirmed() {
    const toRun = live.filter(isActionReady);
    if (toRun.length === 0) return;
    setLogging(true);
    const next: Record<string, { ok: boolean; error?: string }> = { ...results };
    for (const a of toRun) {
      next[a.id] = await execAction(a);
      setResults({ ...next });
    }
    setLogging(false);
    onLogged?.();
  }

  function reset() {
    setPhase('input');
    setDump('');
    setActions([]);
    setDropped(new Set());
    setResults({});
    setError(null);
  }

  const allLogged = live.length > 0 && live.every(a => results[a.id]?.ok);

  return (
    <div style={{ ...cardStyle, borderTop: '3px solid var(--accent-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Mic size={16} style={{ color: 'var(--accent-primary)' }} />
        <strong style={{ color: 'var(--text-primary)' }}>Brain-dump your day</strong>
        <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          voice → paste → confirm → logged
        </span>
      </div>

      {phase === 'input' && (
        <>
          <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', margin: '0 0 8px' }}>
            Dump everything — who you met, who you reached out to, goals you set or finished, your
            check-in, SAT. I&rsquo;ll propose what to log; nothing saves until you confirm.
          </p>
          <textarea
            value={dump}
            onChange={e => setDump(e.target.value)}
            placeholder="e.g. Met Kristian about the InsurX playbook — next step is to send him the deck. DM'd a fractional CSO named Priya at Lumen. Bob replied to my outreach. Finished the vocab engine. Did 30 min SAT, 8/10 on advanced math. Clean focus day, prayed and read scripture."
            rows={5}
            style={textareaStyle}
          />
          {error && <p style={errStyle}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button onClick={parse} disabled={parsing || dump.trim().length < 4} style={primaryBtn}>
              {parsing ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
              {parsing ? 'Parsing…' : 'Parse my day'}
            </button>
            <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
              Tip: dictate with Wispr Flow, then paste.
            </span>
          </div>
        </>
      )}

      {phase === 'review' && (
        <>
          <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginBottom: 10 }}>
            {allLogged
              ? `Logged ${doneCount} item${doneCount === 1 ? '' : 's'}.`
              : `${readyCount} ready to log${live.length - readyCount > 0 ? ` · ${live.length - readyCount} need a pick` : ''}. Review, edit, or drop — then confirm.`}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {INTAKE_CLUSTERS.map(cluster => {
              const inCluster = live.filter(a => INTAKE_ACTION_META[a.type].cluster === cluster.id);
              if (inCluster.length === 0) return null;
              return (
                <div key={cluster.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {cluster.label}
                  </div>
                  {inCluster.map(a => (
                    <ActionRow
                      key={a.id}
                      action={a}
                      result={results[a.id]}
                      onDrop={() => setDropped(prev => new Set(prev).add(a.id))}
                      onField={(k, v) => setField(a.id, k, v)}
                      onPick={tid => pick(a.id, tid)}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {!allLogged && (
              <button
                onClick={logConfirmed}
                disabled={logging || readyCount === 0}
                style={primaryBtn}
              >
                {logging ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                {logging ? 'Logging…' : `Log ${readyCount} confirmed`}
              </button>
            )}
            <button onClick={reset} style={secondaryBtn}>
              {allLogged ? 'New dump' : 'Start over'}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .spin {
          animation: di-spin 0.9s linear infinite;
        }
        @keyframes di-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function ActionRow({
  action,
  result,
  onDrop,
  onField,
  onPick,
}: {
  action: ProposedAction;
  result?: { ok: boolean; error?: string };
  onDrop: () => void;
  onField: (key: string, value: FieldValue) => void;
  onPick: (targetId: string) => void;
}) {
  const meta = INTAKE_ACTION_META[action.type];
  const Icon = ICONS[meta.icon] ?? Target;
  const accent = ACCENT[meta.accent] ?? 'var(--accent-primary)';
  const [open, setOpen] = useState(false);
  const ready = isActionReady(action);
  const logged = result?.ok;

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${logged ? 'var(--success)' : accent}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        padding: '8px 10px',
        opacity: logged ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} style={{ color: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', flex: 1 }}>
          {meta.summarize(action)}
        </span>
        {logged ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: 'var(--success)',
              fontSize: 'var(--fs-3xs)',
            }}
          >
            <Check size={13} /> logged
          </span>
        ) : result && !result.ok ? (
          <span style={{ color: 'var(--error)', fontSize: 'var(--fs-3xs)' }}>{result.error}</span>
        ) : (
          <>
            {meta.fields.length > 0 && (
              <button onClick={() => setOpen(o => !o)} style={miniBtn}>
                {open ? 'Hide' : 'Edit'}
              </button>
            )}
            <button onClick={onDrop} style={miniBtn} aria-label="Drop">
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>

      {!logged && action.needsPick && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--warning)', marginBottom: 4 }}>
            {action.note ?? `Pick which ${meta.targetNoun ?? 'item'}:`}
          </div>
          <select
            value={action.targetId ?? ''}
            onChange={e => e.target.value && onPick(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select…</option>
            {action.candidates?.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!logged && action.note && !action.needsPick && (
        <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginTop: 4 }}>
          {action.note}
        </div>
      )}

      {!logged && open && meta.fields.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {meta.fields.map(spec => (
            <FieldEditor
              key={spec.key}
              spec={spec}
              value={action.fields[spec.key]}
              onChange={v => onField(spec.key, v)}
            />
          ))}
        </div>
      )}

      {!logged && !ready && !action.needsPick && (
        <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--warning)', marginTop: 4 }}>
          Add the required field before logging.
        </div>
      )}
    </div>
  );
}

function FieldEditor({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
}) {
  if (spec.kind === 'bool') {
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-2xs)',
          color: 'var(--text-secondary)',
        }}
      >
        <input
          type="checkbox"
          checked={value === true}
          onChange={e => onChange(e.target.checked)}
        />
        {spec.label}
      </label>
    );
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>{spec.label}</span>
      {spec.kind === 'textarea' ? (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          rows={2}
          style={textareaStyle}
        />
      ) : spec.kind === 'select' ? (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          style={inputStyle}
        >
          <option value="">—</option>
          {spec.options?.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={spec.kind === 'number' ? 'number' : 'text'}
          value={value == null ? '' : String(value)}
          placeholder={spec.placeholder}
          onChange={e =>
            onChange(
              spec.kind === 'number'
                ? e.target.value === ''
                  ? null
                  : Number(e.target.value)
                : e.target.value
            )
          }
          style={inputStyle}
        />
      )}
    </label>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  lineHeight: 1.5,
  resize: 'vertical',
  fontFamily: 'inherit',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-2xs)',
};
const errStyle: React.CSSProperties = {
  fontSize: 'var(--fs-2xs)',
  color: 'var(--error)',
  margin: '8px 0 0',
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--accent-primary)',
  background: 'var(--accent-primary)',
  color: '#fff',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
const miniBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-3xs)',
  cursor: 'pointer',
};
