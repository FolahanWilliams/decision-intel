'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Plus, BookOpen, Trash2 } from 'lucide-react';
import type { SatVocab, GenVocabWord } from './sat-types';

interface Props {
  headers: Record<string, string>;
  vocab: SatVocab[];
  onChanged: () => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  width: '100%',
};
const STATUS_TONE: Record<string, string> = {
  new: 'var(--text-muted)',
  learning: 'var(--warning)',
  reviewing: 'var(--info)',
  mastered: 'var(--success)',
};
const QUALITY = [
  { q: 1, label: 'Again' },
  { q: 3, label: 'Hard' },
  { q: 4, label: 'Good' },
  { q: 5, label: 'Easy' },
];

export function SatVocabBank({ headers, vocab, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [revealed, setRevealed] = useState(false);
  const [gen, setGen] = useState<GenVocabWord[] | null>(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');

  const dueCards = useMemo(
    () => vocab.filter(c => !c.nextDue || new Date(c.nextDue) <= new Date()),
    [vocab]
  );
  const reviewCard = dueCards[0] ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vocab.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return c.word.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q);
    });
  }, [vocab, search, statusFilter]);

  async function review(id: string, q: number) {
    setRevealed(false);
    await fetch('/api/founder-os/sat/vocab', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, quality: q }),
    }).catch(() => {
      /* best-effort */
    });
    onChanged();
  }

  async function generate() {
    setLoadingGen(true);
    setGen(null);
    try {
      const res = await fetch('/api/founder-os/sat/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ kind: 'vocab', count: 4 }),
      });
      const body = await res.json().catch(() => null);
      setGen((body?.data?.words as GenVocabWord[]) ?? []);
    } catch {
      setGen([]);
    } finally {
      setLoadingGen(false);
    }
  }

  async function addWord(w: GenVocabWord) {
    await fetch('/api/founder-os/sat/vocab', {
      method: 'POST',
      headers,
      body: JSON.stringify(w),
    }).catch(() => {
      /* best-effort */
    });
    onChanged();
  }

  async function addManual() {
    if (!word.trim() || !definition.trim()) return;
    await addWord({ word: word.trim(), definition: definition.trim() });
    setWord('');
    setDefinition('');
  }

  async function remove(id: string) {
    await fetch(`/api/founder-os/sat/vocab?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    }).catch(() => {
      /* best-effort */
    });
    onChanged();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Review due */}
      {reviewCard && (
        <div style={{ ...cardStyle, borderTop: '3px solid var(--success)' }}>
          <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginBottom: 6 }}>
            {dueCards.length} due · spaced repetition
          </div>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {reviewCard.word}
          </div>
          {!revealed ? (
            <button onClick={() => setRevealed(true)} style={{ ...secondaryBtn, marginTop: 10 }}>
              Reveal
            </button>
          ) : (
            <>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text-secondary)',
                  margin: '8px 0',
                }}
              >
                {reviewCard.definition}
                {reviewCard.exampleSentence ? (
                  <em style={{ display: 'block', color: 'var(--text-muted)', marginTop: 4 }}>
                    &ldquo;{reviewCard.exampleSentence}&rdquo;
                  </em>
                ) : null}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {QUALITY.map(x => (
                  <button key={x.q} onClick={() => review(reviewCard.id, x.q)} style={secondaryBtn}>
                    {x.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add / generate */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <BookOpen size={16} style={{ color: 'var(--text-secondary)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Add words</strong>
          <button
            onClick={generate}
            disabled={loadingGen}
            style={{ ...secondaryBtn, marginLeft: 'auto' }}
          >
            <Sparkles size={13} /> {loadingGen ? 'Generating…' : 'Generate 4'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="word"
            style={{ ...inputStyle, maxWidth: 160 }}
          />
          <input
            value={definition}
            onChange={e => setDefinition(e.target.value)}
            placeholder="definition"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          />
          <button onClick={addManual} style={primaryBtn}>
            <Plus size={13} /> Add
          </button>
        </div>
        {gen && gen.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {gen.map((w, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-2xs)' }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>{w.word}</strong>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{w.definition}</span>
                <button onClick={() => addWord(w)} style={chipBtn}>
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Library */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words…"
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, maxWidth: 150 }}
          >
            <option value="all">All ({vocab.length})</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="reviewing">Reviewing</option>
            <option value="mastered">Mastered</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', margin: 0 }}>
            No words yet. Generate a few or add words you miss in reading drills.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(c => (
              <details
                key={c.id}
                style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: STATUS_TONE[c.status] ?? 'var(--text-muted)',
                    }}
                  />
                  <strong>{c.word}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-3xs)' }}>
                    {c.status}
                  </span>
                </summary>
                <div style={{ paddingLeft: 16, paddingTop: 4 }}>
                  <p
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-secondary)',
                      margin: '4px 0',
                    }}
                  >
                    {c.definition}
                  </p>
                  {c.mnemonic && (
                    <p
                      style={{
                        fontSize: 'var(--fs-3xs)',
                        color: 'var(--text-muted)',
                        margin: '2px 0',
                      }}
                    >
                      💡 {c.mnemonic}
                    </p>
                  )}
                  {c.exampleSentence && (
                    <p
                      style={{
                        fontSize: 'var(--fs-3xs)',
                        color: 'var(--text-muted)',
                        margin: '2px 0',
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{c.exampleSentence}&rdquo;
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
                      {c.successfulReviews}/{c.totalReviews} reviews
                    </span>
                    <button
                      onClick={() => remove(c.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                      aria-label="Delete word"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 12px',
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
  gap: 5,
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
const chipBtn: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--accent-primary)',
  background: 'transparent',
  color: 'var(--accent-primary)',
  fontSize: 'var(--fs-3xs)',
  cursor: 'pointer',
};
