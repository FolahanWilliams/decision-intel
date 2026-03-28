'use client';

import { useState, useCallback, useEffect } from 'react';
import { Users, Lock, Unlock, CheckCircle, Loader2, Target, Eye, EyeOff, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DecisionRoom {
  id: string;
  title: string;
  status: string;
  createdBy: string;
  participantCount: number;
  priorCount: number;
  createdAt: string;
  decisionType?: string;
  consensusScore?: number;
  biasBriefing?: {
    overallScore?: number;
    biases?: Array<{ biasType: string; severity: string }>;
    toxicCombinations?: Array<{ patternLabel: string }>;
  };
}

// ─── Room List Card ─────────────────────────────────────────────────────────

interface DecisionRoomListProps {
  documentId?: string;
  analysisId?: string;
}

export function DecisionRoomList({ documentId, analysisId }: DecisionRoomListProps) {
  const [rooms, setRooms] = useState<DecisionRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDecisionType, setNewDecisionType] = useState('general');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/decision-rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch {
      setError('Failed to load decision rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/decision-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          documentId,
          analysisId,
          decisionType: newDecisionType !== 'general' ? newDecisionType : undefined,
        }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewDecisionType('general');
        setShowCreate(false);
        fetchRooms();
      }
    } catch {
      setError('Failed to create room');
    } finally {
      setCreating(false);
    }
  }, [newTitle, documentId, analysisId, fetchRooms]);

  if (error) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>{error}</div>
    );
  }
  if (loading) return null;

  return (
    <div
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={16} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Decision Rooms
          </span>
          {rooms.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(167, 139, 250, 0.15)',
                color: '#a78bfa',
                fontWeight: 600,
              }}
            >
              {rooms.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            borderRadius: '6px',
            color: '#a78bfa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600,
          }}
        >
          <Plus size={12} /> New Room
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={newTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                  placeholder="Room title (e.g. Q4 Strategy Review)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCreate()}
                />
                <select
                  value={newDecisionType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setNewDecisionType(e.target.value)
                  }
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    minWidth: '140px',
                  }}
                >
                  <option value="general">General</option>
                  <option value="investment_committee">Investment Committee</option>
                  <option value="board_review">Board Review</option>
                  <option value="deal_committee">Deal Committee</option>
                  <option value="risk_committee">Risk Committee</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newTitle.trim()}
                  style={{
                    padding: '8px 16px',
                    background: newTitle.trim() ? '#a78bfa' : 'rgba(255,255,255,0.04)',
                    border: 'none',
                    borderRadius: '8px',
                    color: newTitle.trim() ? '#fff' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: creating ? 'wait' : 'pointer',
                  }}
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rooms.length === 0 && !showCreate ? (
        <div style={{ padding: '20px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            No decision rooms yet. Create one to collect blind independent priors from your team.
          </p>
        </div>
      ) : (
        <div>
          {rooms.map(room => (
            <div
              key={room.id}
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {room.title}
                  </span>
                  {room.decisionType && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#60a5fa',
                        fontWeight: 500,
                      }}
                    >
                      {room.decisionType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <Users size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {room.participantCount} participants
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <Target size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {room.priorCount} priors submitted
                  </span>
                  {room.biasBriefing && (
                    <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                      {room.biasBriefing.biases?.length ?? 0} biases briefed
                    </span>
                  )}
                  {room.consensusScore != null && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: room.consensusScore >= 60 ? '#22c55e' : '#f59e0b',
                      }}
                    >
                      Consensus: {Math.round(room.consensusScore)}%
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {room.status === 'open' ? (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      fontWeight: 600,
                    }}
                  >
                    <Lock size={8} style={{ display: 'inline', marginRight: '3px' }} />
                    Blind
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(167, 139, 250, 0.15)',
                      color: '#a78bfa',
                      fontWeight: 600,
                    }}
                  >
                    <Unlock size={8} style={{ display: 'inline', marginRight: '3px' }} />
                    Revealed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Blind Prior Submission ─────────────────────────────────────────────────

interface BlindPriorFormProps {
  roomId: string;
  onSubmitted?: () => void;
}

export function BlindPriorForm({ roomId, onSubmitted }: BlindPriorFormProps) {
  const [action, setAction] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [reasoning, setReasoning] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!action.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/decision-rooms/${roomId}/priors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAction: action.trim(),
          confidence,
          reasoning: reasoning.trim() || undefined,
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSubmitted?.();
      }
    } catch {
      setSubmitError('Failed to submit prior');
    } finally {
      setSaving(false);
    }
  }, [roomId, action, confidence, reasoning, onSubmitted]);

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '16px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <CheckCircle size={16} style={{ color: '#22c55e' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Prior submitted blindly.
          </span>{' '}
          Your position will be revealed once all participants have submitted.
        </span>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '6px',
          }}
        >
          <EyeOff size={10} /> Your position (blind — others cannot see this yet)
        </label>
        <textarea
          value={action}
          onChange={e => setAction(e.target.value)}
          placeholder="What would you decide right now?"
          rows={2}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '13px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            resize: 'vertical',
          }}
        />
      </div>
      <div>
        <label
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Confidence</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{confidence}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={confidence}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConfidence(Number(e.target.value))
          }
          style={{ width: '100%' }}
        />
      </div>
      <textarea
        value={reasoning}
        onChange={e => setReasoning(e.target.value)}
        placeholder="Brief reasoning (optional)"
        rows={1}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          resize: 'vertical',
        }}
      />
      {submitError && (
        <div style={{ fontSize: 12, color: '#f87171', padding: '4px 0' }}>{submitError}</div>
      )}
      <button
        onClick={handleSubmit}
        disabled={saving || !action.trim()}
        style={{
          padding: '9px 20px',
          background: action.trim() ? '#a78bfa' : 'rgba(255,255,255,0.04)',
          border: 'none',
          borderRadius: '8px',
          color: action.trim() ? '#fff' : 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
          width: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
        Submit Blind Prior
      </button>
    </div>
  );
}
