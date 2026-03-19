'use client';

import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  isVisible: boolean;
}

export function SuggestedQuestions({ questions, onSelect, isVisible }: SuggestedQuestionsProps) {
  if (!isVisible || questions.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px 0 4px 48px',
        animation: 'fadeSlideUp 0.3s ease-out',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginRight: '4px',
        }}
      >
        <Sparkles size={10} /> Follow-up:
      </span>
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '16px',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            maxWidth: '280px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={q}
        >
          {q}
        </button>
      ))}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
