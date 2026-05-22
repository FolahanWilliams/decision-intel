'use client';

/**
 * TtMeetingPrep — tactical playbook for the TT meeting.
 * Locked 2026-05-21.
 *
 * Three structural elements:
 *   1. The 3-option proposal (4-week / 4-week / 8-week shapes) for TT
 *      to pick after she's heard the framing
 *   2. The 4 strong questions to ask + what to listen for
 *   3. (Discipline lives on PartnershipShape — keeps this surface
 *      focused on the tactical playbook itself)
 *
 * First meeting is value-show + listen + see what happens. No
 * commercial. The 3 options are how you take the conversation from
 * abstract to concrete WITHOUT pitching money.
 */

import { Briefcase, MessageCircle, Ear } from 'lucide-react';
import { TT_MEETING_OPTIONS, TT_STRONG_QUESTIONS } from './sankore-brief-data';

export function TtMeetingPrep() {
  return (
    <section
      style={{
        marginTop: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--accent-secondary, #6366f1)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-2xs)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--accent-secondary, #6366f1)',
          marginBottom: 6,
        }}
      >
        <Briefcase size={12} /> TT meeting · tactical playbook
      </div>
      <h2
        style={{
          fontSize: 'var(--fs-lg)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
          letterSpacing: '-0.018em',
        }}
      >
        Three options TT picks · Four questions you ask
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}
      >
        After you have framed the partnership, take the conversation from abstract to concrete with
        the 3-option proposal. Before any of that, the 4 strong questions earn the depth — listen
        first, sell never.
      </p>

      {/* Three options */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 'var(--fs-2xs)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          marginBottom: 10,
        }}
      >
        <MessageCircle size={12} />
        Three options TT picks
      </div>
      <div
        className="tt-options-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {TT_MEETING_OPTIONS.map(opt => (
          <div
            key={opt.letter}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderTop: '3px solid var(--accent-secondary, #6366f1)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-secondary, #6366f1)',
                  color: '#FFFFFF',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 800,
                }}
              >
                {opt.letter}
              </span>
              <span
                style={{
                  fontSize: 'var(--fs-3xs)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {opt.duration}
              </span>
            </div>
            <h3
              style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {opt.title}
            </h3>
            <p
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {opt.description}
            </p>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 8,
                borderTop: '1px dashed var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--fs-3xs)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 4,
                }}
              >
                When to lead with this
              </div>
              <p
                style={{
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-secondary)',
                  margin: '0 0 6px',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                {opt.rationale}
              </p>
              <div
                style={{
                  fontSize: 'var(--fs-3xs)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                Compounds toward
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: '0 0 0 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {opt.compoundsToward.map((c, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                    }}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Four strong questions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 'var(--fs-2xs)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          marginBottom: 10,
        }}
      >
        <Ear size={12} />
        Four strong questions · earn the depth
      </div>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {TT_STRONG_QUESTIONS.map((q, idx) => (
          <li
            key={idx}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 800,
                }}
              >
                {idx + 1}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{q.question}&rdquo;
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
              className="strong-question-grid"
            >
              <div>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--accent-primary)',
                    marginBottom: 4,
                  }}
                >
                  Why it works
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {q.whyItWorks}
                </p>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--info)',
                    marginBottom: 4,
                  }}
                >
                  Listen for
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {q.listenFor}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <style jsx>{`
        @media (max-width: 900px) {
          .tt-options-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 720px) {
          .strong-question-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
