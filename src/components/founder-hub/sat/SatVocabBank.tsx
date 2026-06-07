'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Plus, BookOpen, Trash2, Lightbulb, Check } from 'lucide-react';
import type { SatVocab, GenVocabWord } from './sat-types';
import { SatVocabReview } from './SatVocabReview';

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

export function SatVocabBank({ headers, vocab, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gen, setGen] = useState<GenVocabWord[] | null>(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vocab.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return c.word.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q);
    });
  }, [vocab, search, statusFilter]);

  async function generate() {
    setLoadingGen(true);
    setGen(null);
    try {
      const res = await fetch('/api/founder-os/sat/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ kind: 'vocab', count: 4, exclude: vocab.map(v => v.word) }),
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

  async function saveMnemonic(id: string, userMnemonic: string) {
    await fetch('/api/founder-os/sat/vocab', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, userMnemonic }),
    }).catch(() => {
      /* best-effort */
    });
    onChanged();
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
      {/* Adaptive review */}
      <SatVocabReview headers={headers} vocab={vocab} onChanged={onChanged} />

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
        <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginBottom: 8 }}>
          Hard, 1550-ceiling words only — excludes ones you already have.
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
        {gen && gen.length === 0 && (
          <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginTop: 8 }}>
            Nothing new to add right now — you may already have these.
          </p>
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
              <VocabRow key={c.id} card={c} onSaveMnemonic={saveMnemonic} onRemove={remove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VocabRow({
  card,
  onSaveMnemonic,
  onRemove,
}: {
  card: SatVocab;
  onSaveMnemonic: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}) {
  const [aidDraft, setAidDraft] = useState(card.userMnemonic ?? '');
  const [hintShown, setHintShown] = useState(false);
  const dirty = aidDraft.trim() !== (card.userMnemonic ?? '').trim();

  return (
    <details style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
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
            background: STATUS_TONE[card.status] ?? 'var(--text-muted)',
          }}
        />
        <strong>{card.word}</strong>
        {card.ipa && (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-3xs)' }}>{card.ipa}</span>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-3xs)', marginLeft: 'auto' }}>
          {card.status}
        </span>
      </summary>
      <div style={{ paddingLeft: 16, paddingTop: 4 }}>
        <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', margin: '4px 0' }}>
          {card.partOfSpeech ? (
            <em style={{ color: 'var(--text-muted)' }}>{card.partOfSpeech} · </em>
          ) : null}
          {card.definition}
        </p>
        {card.exampleSentence && (
          <p
            style={{
              fontSize: 'var(--fs-3xs)',
              color: 'var(--text-muted)',
              margin: '2px 0',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{card.exampleSentence}&rdquo;
          </p>
        )}
        {card.etymology && (
          <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', margin: '2px 0' }}>
            ⚯ {card.etymology}
          </p>
        )}

        {/* relation chips */}
        {(card.synonyms.length > 0 || card.antonyms.length > 0 || card.relatedWords.length > 0) && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '6px 0' }}>
            {card.synonyms.map(s => (
              <span key={`s-${s}`} style={relChip('var(--success)')}>
                = {s}
              </span>
            ))}
            {card.antonyms.map(a => (
              <span key={`a-${a}`} style={relChip('var(--error)')}>
                ≠ {a}
              </span>
            ))}
            {card.relatedWords.map(r => (
              <span key={`r-${r}`} style={relChip('var(--info)')}>
                ~ {r}
              </span>
            ))}
          </div>
        )}

        {/* Your own memory aid (the generation effect) */}
        <div style={{ margin: '8px 0' }}>
          <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginBottom: 3 }}>
            Your memory aid (self-made aids stick harder)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={aidDraft}
              onChange={e => setAidDraft(e.target.value)}
              placeholder="write your own hook…"
              style={{ ...inputStyle, flex: 1, fontSize: 'var(--fs-3xs)', padding: '4px 8px' }}
            />
            {dirty && (
              <button
                onClick={() => onSaveMnemonic(card.id, aidDraft.trim())}
                style={{ ...chipBtn, borderColor: 'var(--success)', color: 'var(--success)' }}
                aria-label="Save memory aid"
              >
                <Check size={12} /> Save
              </button>
            )}
          </div>
        </div>

        {/* AI hint — hidden until you've tried yourself */}
        {card.mnemonic &&
          (hintShown ? (
            <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', margin: '4px 0' }}>
              💡 {card.mnemonic}
            </p>
          ) : (
            <button
              onClick={() => setHintShown(true)}
              style={{
                ...chipBtn,
                marginTop: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Lightbulb size={12} /> Reveal AI hint
            </button>
          ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
            {card.successfulReviews}/{card.totalReviews} reviews
          </span>
          {card.responseMsEma != null && card.responseMsEma > 0 && (
            <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
              ~{(card.responseMsEma / 1000).toFixed(1)}s recall
            </span>
          )}
          <button
            onClick={() => onRemove(card.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              marginLeft: 'auto',
            }}
            aria-label="Delete word"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </details>
  );
}

function relChip(color: string): React.CSSProperties {
  return {
    padding: '1px 7px',
    borderRadius: 'var(--radius-full)',
    border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
    background: `color-mix(in srgb, ${color} 8%, transparent)`,
    color,
    fontSize: 'var(--fs-3xs)',
  };
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
