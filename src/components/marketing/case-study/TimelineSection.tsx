import { Clock } from 'lucide-react';
import type { CaseTimelineEvent } from '@/lib/data/case-studies/types';

/** Dated sequence of pre-decision signals. Vertical timeline with
 *  alternating markers — lets readers see *how long* evidence accumulated
 *  before the outcome, which is a key narrative beat for the platform pitch. */
export function TimelineSection({ timeline }: { timeline: CaseTimelineEvent[] }) {
  if (!timeline.length) return null;

  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#16A34A',
          marginBottom: 8,
        }}
      >
        Evidence Timeline
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        What was visible, and when
      </h2>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 24px' }}>
        Every event below was documentable{' '}
        <em>before</em> the outcome was known. The platform looks for signals
        like these in live memos.
      </p>

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          position: 'relative',
          paddingLeft: 28,
        }}
      >
        {/* Central rail */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 9,
            top: 8,
            bottom: 8,
            width: 2,
            background: 'linear-gradient(180deg, #16A34A 0%, #E2E8F0 100%)',
            borderRadius: 1,
          }}
        />

        {timeline.map((event, i) => (
          <li
            key={i}
            style={{
              position: 'relative',
              paddingBottom: i < timeline.length - 1 ? 24 : 0,
            }}
          >
            {/* Marker */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: -28,
                top: 4,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: `3px solid ${i === timeline.length - 1 ? '#DC2626' : '#16A34A'}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i === timeline.length - 1 && (
                <Clock size={9} style={{ color: '#DC2626' }} />
              )}
            </span>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0F172A',
                  letterSpacing: '0.04em',
                  marginBottom: 4,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {event.date}
              </div>
              <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.55 }}>
                {event.event}
              </div>
              {event.source && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    marginTop: 6,
                    fontStyle: 'italic',
                  }}
                >
                  {event.source}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
