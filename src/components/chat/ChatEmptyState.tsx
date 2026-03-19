'use client';

import { Brain, FileText, Upload } from 'lucide-react';
import Link from 'next/link';

interface ChatEmptyStateProps {
  documents: Array<{ id: string; filename: string; status: string }>;
  onSuggestQuestion: (question: string) => void;
}

function getGreeting(): string {
  if (typeof window === 'undefined') return 'Hello';
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Compute once at module load time (client-only since this is a 'use client' module)
const GREETING = getGreeting();

const STARTER_QUESTIONS_WITH_DOCS = [
  'What biases were most commonly found across my documents?',
  'Compare the risk levels across my analyzed documents.',
  'What patterns do you see in my decision-making?',
  'Which document had the best decision quality and why?',
];

const STARTER_QUESTIONS_NO_DOCS = [
  'What are the most common cognitive biases in business decisions?',
  'How can I improve my decision-making process?',
  'What is decision noise and why does it matter?',
];

export function ChatEmptyState({ documents, onSuggestQuestion }: ChatEmptyStateProps) {
  const analyzedDocs = documents.filter(d => d.status === 'complete');
  const hasDocs = analyzedDocs.length > 0;
  const starterQuestions = hasDocs ? STARTER_QUESTIONS_WITH_DOCS : STARTER_QUESTIONS_NO_DOCS;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-xl)',
        maxWidth: '560px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <Brain size={28} style={{ color: 'var(--text-highlight)' }} />
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        {GREETING}! I&apos;m your Second Brain.
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: 'var(--spacing-lg)',
          lineHeight: 1.5,
        }}
      >
        {hasDocs
          ? `I have access to ${analyzedDocs.length} analyzed document${analyzedDocs.length !== 1 ? 's' : ''}. Ask me anything about your decisions, biases, or risk patterns.`
          : 'Upload a document to get personalized insights, or ask me about decision-making and cognitive biases.'}
      </p>

      {/* Document chips */}
      {hasDocs && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            justifyContent: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          {analyzedDocs.slice(0, 3).map(doc => (
            <span
              key={doc.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                fontSize: '11px',
                background: 'rgba(48, 209, 88, 0.08)',
                border: '1px solid rgba(48, 209, 88, 0.2)',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <FileText size={10} />
              {doc.filename.length > 25 ? doc.filename.slice(0, 25) + '...' : doc.filename}
            </span>
          ))}
          {analyzedDocs.length > 3 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px 6px' }}>
              +{analyzedDocs.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Starter questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Try asking:
        </span>
        {starterQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSuggestQuestion(q)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ color: 'var(--text-highlight)' }}>→</span>
            {q}
          </button>
        ))}
      </div>

      {/* Upload CTA if no docs */}
      {!hasDocs && (
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'var(--spacing-lg)',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-highlight)',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <Upload size={14} />
          Upload a document
        </Link>
      )}
    </div>
  );
}
