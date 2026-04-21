'use client';

/**
 * TodoTab — plain task list inside the Founder Hub.
 *
 * Deliberately minimal. No priority, no tags, no drag. The Hub already
 * has UnicornRoadmapTab, ForecastRoadmapTab, OutreachCommandCenterTab
 * for the structured views. This tab is the day-to-day "what do I need
 * to do this week" list that every other roadmap surface is too
 * structured to hold cleanly.
 *
 * Pinned tasks pin to the top (used for meeting prep items the founder
 * doesn't want buried by ambient churn — e.g. Thursday CEO call).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Pin,
  PinOff,
  Trash2,
  CheckCircle2,
  Circle,
  Plus,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { card, sectionTitle } from './shared-styles';

interface FounderTodo {
  id: string;
  title: string;
  done: boolean;
  pinned: boolean;
  dueDate: string | null;
  createdAt: string;
}

interface TodoTabProps {
  founderPass: string;
}

type Filter = 'all' | 'open' | 'done';

export function TodoTab({ founderPass }: TodoTabProps) {
  const [todos, setTodos] = useState<FounderTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [filter, setFilter] = useState<Filter>('open');

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-founder-pass': founderPass,
    }),
    [founderPass]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-hub/todos', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load to-dos');
      setTodos(data.data?.todos ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load to-dos');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (founderPass) load();
  }, [founderPass, load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/founder-hub/todos', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title,
          dueDate: newDue || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setTodos(prev => [data.data.todo, ...prev]);
      setNewTitle('');
      setNewDue('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePatch = async (id: string, body: Partial<FounderTodo>) => {
    // Optimistic update — the UI shouldn't feel network-bound for a tiny
    // "check this box" action. Roll back only if the server rejects.
    const prev = todos;
    setTodos(cur => cur.map(t => (t.id === id ? ({ ...t, ...body } as FounderTodo) : t)));
    try {
      const res = await fetch(`/api/founder-hub/todos/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setTodos(prev);
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Failed to update');
      }
    } catch {
      setTodos(prev);
      setError('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this to-do? This cannot be undone.')) return;
    const prev = todos;
    setTodos(cur => cur.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/founder-hub/todos/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) setTodos(prev);
    } catch {
      setTodos(prev);
    }
  };

  const filtered = todos.filter(t => {
    if (filter === 'open') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const openCount = todos.filter(t => !t.done).length;
  const doneCount = todos.filter(t => t.done).length;

  return (
    <div>
      <div style={{ ...card }}>
        <div style={{ ...sectionTitle }}>
          <CheckCircle2 size={18} style={{ color: 'var(--accent-primary)', marginRight: 8 }} />
          To-do
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Plain task list. Pinned tasks stay at the top. Deliberately short — the Unicorn Roadmap
          and Forecast tabs hold the structured stuff.
        </p>

        {/* Add form */}
        <form onSubmit={handleAdd} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="What needs doing..."
              maxLength={400}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <input
              type="date"
              value={newDue}
              onChange={e => setNewDue(e.target.value)}
              style={{
                padding: '10px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                outline: 'none',
              }}
              aria-label="Due date (optional)"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#fff',
                cursor: submitting ? 'wait' : 'pointer',
                opacity: !newTitle.trim() || submitting ? 0.6 : 1,
              }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </div>
        </form>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['open', 'done', 'all'] as Filter[]).map(f => {
            const isActive = filter === f;
            const count = f === 'open' ? openCount : f === 'done' ? doneCount : todos.length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: isActive ? 'rgba(22,163,74,0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8,
              color: '#DC2626',
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            Loading to-dos&hellip;
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              border: '1px dashed var(--border-color)',
              borderRadius: 10,
            }}
          >
            {filter === 'done'
              ? 'No completed to-dos yet.'
              : filter === 'all' && todos.length === 0
                ? 'Nothing on the list. Add the first thing above — for example, “Prep for Thursday’s UK funding-CEO call.”'
                : 'All clear.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(t => (
              <TodoRow
                key={t.id}
                todo={t}
                onToggleDone={() => handlePatch(t.id, { done: !t.done })}
                onTogglePin={() => handlePatch(t.id, { pinned: !t.pinned })}
                onDelete={() => handleDelete(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TodoRow({
  todo,
  onToggleDone,
  onTogglePin,
  onDelete,
}: {
  todo: FounderTodo;
  onToggleDone: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  // Pin "now" to a stable value captured at mount. Using Date.now() during
  // render would be impure (React 19 rules-of-hooks flag); for a to-do row
  // the 1-day past-due threshold is robust to a mount-time reference.
  const [now] = useState(() => Date.now());
  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
  const isPastDue = !todo.done && dueDate && dueDate.getTime() < now - 24 * 60 * 60 * 1000;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        border: `1px solid ${todo.pinned ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        background: todo.pinned
          ? 'rgba(22,163,74,0.05)'
          : todo.done
            ? 'transparent'
            : 'var(--bg-card)',
        opacity: todo.done ? 0.55 : 1,
      }}
    >
      <button
        onClick={onToggleDone}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          color: todo.done ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}
        aria-label={todo.done ? 'Mark as open' : 'Mark as done'}
      >
        {todo.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
            textDecoration: todo.done ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {todo.title}
        </div>
        {dueDate && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              marginTop: 3,
              color: isPastDue ? 'var(--error)' : 'var(--text-muted)',
              fontWeight: isPastDue ? 600 : 500,
            }}
          >
            <CalendarDays size={11} />
            {dueDate.toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
            {isPastDue && ' · past due'}
          </div>
        )}
      </div>

      <button
        onClick={onTogglePin}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          color: todo.pinned ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}
        aria-label={todo.pinned ? 'Unpin' : 'Pin to top'}
      >
        {todo.pinned ? <Pin size={14} /> : <PinOff size={14} />}
      </button>

      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
        }}
        aria-label="Delete to-do"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
