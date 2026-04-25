'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  ChevronDown,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Calendar,
} from 'lucide-react';
import { TeammatePicker } from './TeammatePicker';

// ─── Types ────────────────────────────────────────────────────────────────

interface CommentAuthor {
  userId: string;
  isSelf: boolean;
  displayName: string | null;
  email: string | null;
}

interface BiasComment {
  id: string;
  biasInstanceId: string;
  authorUserId: string;
  body: string;
  parentCommentId: string | null;
  mentions: string[];
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface BiasTask {
  id: string;
  biasInstanceId: string;
  assigneeUserId: string;
  createdByUserId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  title: string;
  description: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

interface Props {
  biasInstanceId: string;
  /** When undefined, defaults to collapsed. */
  initiallyOpen?: boolean;
}

const STATUS_LABELS: Record<BiasTask['status'], string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};
const STATUS_COLORS: Record<BiasTask['status'], string> = {
  open: 'var(--accent-primary)',
  in_progress: 'var(--info, #3b82f6)',
  resolved: 'var(--success, #10b981)',
  dismissed: 'var(--text-muted)',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function authorLabel(a: CommentAuthor): string {
  if (a.isSelf) return 'You';
  return a.displayName || a.email || 'Teammate';
}

// ─── Comment row ──────────────────────────────────────────────────────────

function CommentRow({
  c,
  onResolveToggle,
  onDelete,
}: {
  c: BiasComment;
  onResolveToggle: (c: BiasComment) => void;
  onDelete: (c: BiasComment) => void;
}) {
  const isResolved = !!c.resolvedAt;
  return (
    <div
      style={{
        padding: '10px 12px',
        background: isResolved ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        opacity: isResolved ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {authorLabel(c.author)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatDate(c.createdAt)}
        </span>
        {isResolved && (
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: 'var(--success, #10b981)15',
              color: 'var(--success, #10b981)',
              borderRadius: 999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Resolved
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {c.body}
      </p>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => onResolveToggle(c)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isResolved ? 'Reopen' : 'Mark resolved'}
        </button>
        {c.author.isSelf && (
          <button
            onClick={() => onDelete(c)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Trash2 size={10} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onStatusChange,
  onDelete,
  isCreator,
}: {
  task: BiasTask;
  onStatusChange: (task: BiasTask, status: BiasTask['status']) => void;
  onDelete: (task: BiasTask) => void;
  isCreator: boolean;
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${STATUS_COLORS[task.status]}`,
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
            }}
          >
            {task.title}
          </div>
          {task.description && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 2,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {task.description}
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: STATUS_COLORS[task.status],
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {STATUS_LABELS[task.status]}
        </span>
      </div>
      <div
        className="flex items-center gap-3 mt-2 flex-wrap"
        style={{ fontSize: 11, color: 'var(--text-muted)' }}
      >
        {task.dueAt && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={10} /> due {formatDate(task.dueAt)}
          </span>
        )}
        <select
          value={task.status}
          onChange={e => onStatusChange(task, e.target.value as BiasTask['status'])}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          {(Object.keys(STATUS_LABELS) as BiasTask['status'][]).map(s => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {isCreator && (
          <button
            onClick={() => onDelete(task)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Trash2 size={10} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────

export function BiasCollabPanel({ biasInstanceId, initiallyOpen = false }: Props) {
  const [expanded, setExpanded] = useState(initiallyOpen);
  const [comments, setComments] = useState<BiasComment[]>([]);
  const [tasks, setTasks] = useState<BiasTask[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose state
  const [newCommentBody, setNewCommentBody] = useState('');
  const [posting, setPosting] = useState(false);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | null>(null);
  const [taskDueAt, setTaskDueAt] = useState<string>('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch(`/api/bias-comments?biasInstanceId=${encodeURIComponent(biasInstanceId)}`),
        fetch(`/api/bias-tasks?biasInstanceId=${encodeURIComponent(biasInstanceId)}`),
      ]);
      if (cRes.ok) {
        const data = (await cRes.json()) as { comments: BiasComment[] };
        setComments(data.comments);
        const self = data.comments.find(c => c.author.isSelf);
        if (self) setCurrentUserId(self.authorUserId);
      } else {
        const body = await cRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load comments');
      }
      if (tRes.ok) {
        const data = (await tRes.json()) as { tasks: BiasTask[] };
        setTasks(data.tasks);
      } else if (tRes.status !== 404) {
        const body = await tRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load tasks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collab data');
    } finally {
      setLoading(false);
    }
  }, [biasInstanceId]);

  useEffect(() => {
    if (expanded) void refresh();
  }, [expanded, refresh]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentBody.trim();
    if (!trimmed) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch('/api/bias-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biasInstanceId, body: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to post comment');
      }
      setNewCommentBody('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError(null);
    if (!taskTitle.trim()) {
      setTaskFormError('Title is required');
      return;
    }
    if (!taskAssigneeId) {
      setTaskFormError('Pick an assignee');
      return;
    }
    setTaskSubmitting(true);
    try {
      const res = await fetch('/api/bias-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biasInstanceId,
          assigneeUserId: taskAssigneeId,
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create task');
      }
      setTaskTitle('');
      setTaskDescription('');
      setTaskAssigneeId(null);
      setTaskDueAt('');
      setTaskFormOpen(false);
      await refresh();
    } catch (err) {
      setTaskFormError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleResolveToggle = async (c: BiasComment) => {
    try {
      const res = await fetch(`/api/bias-comments/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !c.resolvedAt }),
      });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (c: BiasComment) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/bias-comments/${c.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const handleTaskStatusChange = async (task: BiasTask, status: BiasTask['status']) => {
    try {
      const res = await fetch(`/api/bias-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (task: BiasTask) => {
    if (!window.confirm(`Remove task "${task.title}"?`)) return;
    try {
      const res = await fetch(`/api/bias-tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const commentCount = comments.length;
  const openTaskCount = tasks.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
      <button
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 12,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
        }}
      >
        <ChevronDown
          size={12}
          style={{ transition: 'transform .15s', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <MessageSquare size={12} />
        <span>
          Discussion ({commentCount})
        </span>
        <span style={{ opacity: 0.7 }}>·</span>
        <UserPlus size={12} />
        <span>
          Tasks ({openTaskCount} open / {tasks.length} total)
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--severity-high)',
                padding: '6px 10px',
                background: 'var(--severity-high)10',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}

          {/* Comments thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading && comments.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Loader2 size={12} className="animate-spin" /> Loading thread…
              </div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Start the conversation. Use <code>@user@example.com</code> to mention a teammate
                — they&apos;ll get an in-app nudge.
              </div>
            ) : (
              comments.map(c => (
                <CommentRow
                  key={c.id}
                  c={c}
                  onResolveToggle={handleResolveToggle}
                  onDelete={handleDeleteComment}
                />
              ))
            )}
            <form
              onSubmit={submitComment}
              style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}
            >
              <textarea
                value={newCommentBody}
                onChange={e => setNewCommentBody(e.target.value)}
                placeholder="Add a comment, or @mention a teammate"
                rows={2}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <button
                type="submit"
                disabled={posting || !newCommentBody.trim()}
                style={{
                  padding: '8px 12px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: posting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  opacity: posting || !newCommentBody.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-start',
                }}
              >
                {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Post
              </button>
            </form>
          </div>

          {/* Tasks list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.length > 0 && (
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                Tasks
              </div>
            )}
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onStatusChange={handleTaskStatusChange}
                onDelete={handleDeleteTask}
                isCreator={currentUserId === task.createdByUserId}
              />
            ))}

            {!taskFormOpen && (
              <button
                onClick={() => setTaskFormOpen(true)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Plus size={12} /> Assign as task
              </button>
            )}

            {taskFormOpen && (
              <form
                onSubmit={submitTask}
                style={{
                  padding: 12,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <input
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="What needs investigating? e.g. Check the revenue projection's anchor"
                  required
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                  }}
                />
                <textarea
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional context (max 4000 chars)"
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <TeammatePicker
                    value={taskAssigneeId}
                    onChange={setTaskAssigneeId}
                    excludeUserId={currentUserId ?? undefined}
                    placeholder="Assign to…"
                  />
                  <input
                    type="datetime-local"
                    value={taskDueAt}
                    onChange={e => setTaskDueAt(e.target.value)}
                    style={{
                      padding: '7px 10px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                    }}
                  />
                </div>
                {taskFormError && (
                  <div style={{ fontSize: 12, color: 'var(--severity-high)' }}>
                    {taskFormError}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskFormOpen(false);
                      setTaskFormError(null);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={taskSubmitting}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: taskSubmitting ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      opacity: taskSubmitting ? 0.6 : 1,
                    }}
                  >
                    {taskSubmitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    Assign task
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
