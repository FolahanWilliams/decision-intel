'use client';

import { useState, useCallback } from 'react';
import { BookOpen, CheckCircle, Circle, ChevronRight, ChevronLeft, Loader2, ExternalLink, GraduationCap } from 'lucide-react';
import { TRACKS, TOTAL_LESSONS, getProgress, type Track, type Lesson } from '@/lib/data/founder-school/lessons';

const STORAGE_KEY = 'founder-school-progress';

interface Source {
  title: string;
  type: string;
  author: string;
  description: string;
  searchUrl: string;
}

interface FounderSchoolTabProps {
  founderPass: string;
}

// ─── Track Sidebar ───────────────────────────────────────────────────────────

function TrackList({
  tracks,
  selectedId,
  completed,
  onSelect,
}: {
  tracks: Track[];
  selectedId: string;
  completed: string[];
  onSelect: (id: string) => void;
}) {
  const prog = getProgress(completed);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tracks.map(track => {
        const tp = prog.byTrack[track.id];
        const pct = tp ? Math.round((tp.done / tp.total) * 100) : 0;
        const isActive = selectedId === track.id;
        return (
          <button
            key={track.id}
            onClick={() => onSelect(track.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isActive ? track.color + '50' : 'var(--border-color)'}`,
              background: isActive ? track.color + '10' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{track.emoji}</span>
              <span style={{
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? track.color : 'var(--text-secondary)',
                lineHeight: 1.3,
              }}>
                {track.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                flex: 1,
                height: 3,
                background: 'var(--bg-tertiary)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: track.color,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {tp?.done ?? 0}/{tp?.total ?? 7}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Lessons List ─────────────────────────────────────────────────────────────

function LessonsList({
  track,
  completed,
  onSelect,
}: {
  track: Track;
  completed: string[];
  onSelect: (lesson: Lesson) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: track.color }}>
          {track.emoji} {track.title}
        </span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{track.description}</p>
      </div>
      {track.lessons.map(lesson => {
        const done = completed.includes(lesson.id);
        return (
          <button
            key={lesson.id}
            onClick={() => onSelect(lesson)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: done ? track.color + '08' : 'var(--bg-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
          >
            {done
              ? <CheckCircle size={16} style={{ color: track.color, flexShrink: 0 }} />
              : <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {lesson.order}. {lesson.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lesson.summary}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lesson.readTime}</span>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Lesson Detail ────────────────────────────────────────────────────────────

function LessonDetail({
  track,
  lesson,
  completed,
  founderPass,
  onBack,
  onToggleComplete,
  onPrev,
  onNext,
}: {
  track: Track;
  lesson: Lesson;
  completed: string[];
  founderPass: string;
  onBack: () => void;
  onToggleComplete: (id: string) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const isDone = completed.includes(lesson.id);

  const fetchSources = useCallback(async () => {
    setLoadingSources(true);
    setSourceError(null);
    try {
      const params = new URLSearchParams({
        trackId: track.id,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
      });
      const res = await fetch(`/api/founder-hub/founder-school/sources?${params}`, {
        headers: { 'x-founder-pass': founderPass },
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setSources(json.data?.sources ?? []);
    } catch {
      setSourceError('Could not fetch resources. Try again.');
    } finally {
      setLoadingSources(false);
    }
  }, [track.id, lesson.id, lesson.title, founderPass]);

  const section = (label: string, content: string, accent?: string) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: accent ?? 'var(--text-muted)',
        marginBottom: 6,
      }}>{label}</div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{content}</p>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: 'var(--text-muted)', padding: '0 0 12px',
        }}
      >
        <ChevronLeft size={13} /> {track.emoji} {track.title}
      </button>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: track.color + '20', color: track.color,
            border: `1px solid ${track.color}40`,
          }}>{lesson.readTime}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lesson {lesson.order} of {track.lessons.length}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {lesson.title}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{lesson.summary}</p>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
        {section('Core Insight', lesson.insight)}
        {section('Why It Matters for Decision Intel', lesson.whyItMatters, track.color)}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', marginBottom: 6 }}>
            Apply Today
          </div>
          <div style={{
            background: 'var(--accent-primary)0D',
            border: '1px solid var(--accent-primary)30',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{lesson.action}</p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Reflect
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
            {lesson.reflection}
          </p>
        </div>

        {/* Primary sources — only shown on lessons that carry them
            (currently: Platform Foundations track). */}
        {lesson.sources && lesson.sources.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
              Primary sources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lesson.sources.map((src, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}
                  >
                    {src.label}
                  </span>
                  {src.detail && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {src.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ready-to-use buyer pitches — methodology + GTM lessons carry
            these so you can walk into the meeting already fluent. Four
            personas covered: CSO, M&A, Corporate Strategy, VC. */}
        {(lesson.csoPitch || lesson.mnaPitch || lesson.corpStrategyPitch || lesson.vcPitch) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {lesson.csoPitch && (
              <PitchCard
                label="60-second pitch · CSO"
                body={lesson.csoPitch}
                background="rgba(22,163,74,0.06)"
                border="rgba(22,163,74,0.24)"
                labelColor="var(--accent-primary)"
              />
            )}
            {lesson.mnaPitch && (
              <PitchCard
                label="60-second pitch · M&A"
                body={lesson.mnaPitch}
                background="rgba(14,116,144,0.06)"
                border="rgba(14,116,144,0.24)"
                labelColor="#0E7490"
              />
            )}
            {lesson.corpStrategyPitch && (
              <PitchCard
                label="60-second pitch · Corp Strategy"
                body={lesson.corpStrategyPitch}
                background="rgba(124,58,237,0.06)"
                border="rgba(124,58,237,0.24)"
                labelColor="#7C3AED"
              />
            )}
            {lesson.vcPitch && (
              <PitchCard
                label="60-second pitch · VC"
                body={lesson.vcPitch}
                background="rgba(15,23,42,0.04)"
                border="rgba(15,23,42,0.14)"
                labelColor="#0F172A"
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
        {onPrev && (
          <button onClick={onPrev} style={navBtn}>
            <ChevronLeft size={13} /> Prev
          </button>
        )}
        <button
          onClick={() => onToggleComplete(lesson.id)}
          style={{
            ...navBtn,
            background: isDone ? track.color + '20' : track.color,
            color: isDone ? track.color : '#fff',
            border: `1px solid ${track.color}`,
            fontWeight: 700,
          }}
        >
          {isDone ? <CheckCircle size={13} /> : <Circle size={13} />}
          {isDone ? 'Completed' : 'Mark Complete'}
        </button>
        {onNext && (
          <button onClick={onNext} style={navBtn}>
            Next <ChevronRight size={13} />
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={fetchSources}
          disabled={loadingSources}
          style={{
            ...navBtn,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            opacity: loadingSources ? 0.7 : 1,
          }}
        >
          {loadingSources ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
          {sources ? 'Refresh Resources' : 'Find Resources'}
        </button>
      </div>

      {/* Sources Panel */}
      {sourceError && (
        <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 12 }}>{sourceError}</p>
      )}
      {sources && sources.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Curated Resources — {lesson.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((src, i) => (
              <a
                key={i}
                href={src.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-primary)20', color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)40',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{src.type}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{src.title}</span>
                  <ExternalLink size={11} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{src.author}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{src.description}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '7px 12px', borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
  cursor: 'pointer',
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function FounderSchoolTab({ founderPass }: FounderSchoolTabProps) {
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [selectedTrackId, setSelectedTrackId] = useState(TRACKS[0].id);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const toggleComplete = useCallback((id: string) => {
    setCompleted(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const track = TRACKS.find(t => t.id === selectedTrackId) ?? TRACKS[0];
  const prog = getProgress(completed);

  const lessonIndex = selectedLesson ? track.lessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const prevLesson = lessonIndex > 0 ? track.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < track.lessons.length - 1 ? track.lessons[lessonIndex + 1] : null;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Founder School</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>
            {TRACKS.length} tracks · {TOTAL_LESSONS} lessons · tuned to Decision Intel
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 100, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${prog.pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{prog.done}/{prog.total}</span>
        </div>
      </div>

      {/* Body — 2-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 400 }}>
        {/* Track List */}
        <div style={{ borderRight: '1px solid var(--border-color)', padding: '12px 10px', overflowY: 'auto' }}>
          <TrackList
            tracks={TRACKS}
            selectedId={selectedTrackId}
            completed={completed}
            onSelect={(id) => { setSelectedTrackId(id); setSelectedLesson(null); }}
          />
        </div>

        {/* Content Panel */}
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          {selectedLesson ? (
            <LessonDetail
              track={track}
              lesson={selectedLesson}
              completed={completed}
              founderPass={founderPass}
              onBack={() => setSelectedLesson(null)}
              onToggleComplete={toggleComplete}
              onPrev={prevLesson ? () => setSelectedLesson(prevLesson) : null}
              onNext={nextLesson ? () => setSelectedLesson(nextLesson) : null}
            />
          ) : (
            <LessonsList
              track={track}
              completed={completed}
              onSelect={setSelectedLesson}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PitchCard({
  label,
  body,
  background,
  border,
  labelColor,
}: {
  label: string;
  body: string;
  background: string;
  border: string;
  labelColor: string;
}) {
  return (
    <div
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: labelColor,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
        &ldquo;{body}&rdquo;
      </p>
    </div>
  );
}
