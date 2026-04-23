'use client';

/**
 * Partner detail — My Offer tab.
 *
 * Renders offerSpec (pricing + inclusions + the ask) and positioning
 * (category anchor, opening line, ethos/pathos/logos cheat-sheet).
 * This is the tab the founder glances at the morning of the meeting.
 */

import { DollarSign, PackageCheck, Handshake, Compass, MessageSquareQuote } from 'lucide-react';
import type { Application } from '../types';

interface Props {
  app: Application;
}

export function PartnerOfferTab({ app }: Props) {
  const profile = app.richProfile ?? null;
  const offer = profile?.offerSpec ?? null;
  const positioning = profile?.positioning ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Pricing */}
      {offer?.pricing && (
        <section>
          <SectionHeading icon={<DollarSign size={14} />} label="Pricing for this partner" />
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background:
                'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(22,163,74,0.02) 100%)',
              border: '1px solid rgba(22,163,74,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {offer.pricing.rate}
              </span>
              {offer.pricing.label && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {offer.pricing.label}
                </span>
              )}
              {offer.pricing.delta && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  · {offer.pricing.delta}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gap: 10,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              {offer.pricing.floor && <PricingCell label="Floor" value={offer.pricing.floor} />}
              {offer.pricing.fallbackOffer && (
                <PricingCell label="Fallback" value={offer.pricing.fallbackOffer} />
              )}
              {offer.pricing.hardNo && (
                <PricingCell label="Hard no" value={offer.pricing.hardNo} tone="danger" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Inclusions */}
      {offer?.inclusions && offer.inclusions.length > 0 && (
        <section>
          <SectionHeading icon={<PackageCheck size={14} />} label="What's included" />
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {offer.inclusions.map((line, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--accent-primary)',
                    marginTop: 6,
                  }}
                />
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The ask */}
      {offer?.ask && (offer.ask.short || offer.ask.long) && (
        <section>
          <SectionHeading icon={<Handshake size={14} />} label="The ask" />
          {offer.ask.short && (
            <div
              style={{
                padding: 10,
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                background: 'var(--bg-card)',
                marginBottom: 10,
                fontSize: 12.5,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginRight: 8,
                }}
              >
                Headline
              </span>
              {offer.ask.short}
            </div>
          )}
          {offer.ask.long && (
            <div
              style={{
                padding: 12,
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                background: 'var(--bg-secondary)',
                fontSize: 12.5,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
              }}
            >
              {offer.ask.long}
            </div>
          )}
        </section>
      )}

      {/* Positioning */}
      {positioning && (
        <section>
          <SectionHeading icon={<Compass size={14} />} label="Positioning for this meeting" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {positioning.categoryAnchor && (
              <PositioningBlock label="Category anchor" value={positioning.categoryAnchor} />
            )}
            {positioning.openingLine && (
              <PositioningBlock
                label="Opening line"
                value={`"${positioning.openingLine}"`}
                italic
              />
            )}
            {positioning.avoidFraming && positioning.avoidFraming.length > 0 && (
              <div
                style={{
                  padding: 10,
                  background: 'rgba(220,38,38,0.05)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--error, #DC2626)',
                    marginBottom: 6,
                  }}
                >
                  Banned framing
                </div>
                <ul
                  style={{
                    paddingLeft: 16,
                    margin: 0,
                    fontSize: 11.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {positioning.avoidFraming.map((item, i) => (
                    <li key={i} style={{ lineHeight: 1.55 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {positioning.ethosAnchors && positioning.ethosAnchors.length > 0 && (
              <PositioningBlock
                label="Ethos anchors"
                value={positioning.ethosAnchors.join(' · ')}
              />
            )}
            {positioning.pathosCurrents && positioning.pathosCurrents.length > 0 && (
              <div>
                <BlockLabel text="Pathos — moves" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {positioning.pathosCurrents.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        background: 'var(--bg-card)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 4,
                        }}
                      >
                        {p.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.55,
                          fontStyle: 'italic',
                        }}
                      >
                        &ldquo;{p.moveIn}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {positioning.logosMoves && positioning.logosMoves.length > 0 && (
              <div>
                <BlockLabel
                  text="Logos — three claims + follow-ups"
                  icon={<MessageSquareQuote size={12} />}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {positioning.logosMoves.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        background: 'var(--bg-card)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-primary)',
                          lineHeight: 1.55,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            color: 'var(--accent-primary)',
                            marginRight: 8,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {m.claim}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}
                      >
                        Follow-up: {m.followUp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {!offer && !positioning && (
        <Placeholder text="No offer or positioning captured yet. Populate richProfile.offerSpec / richProfile.positioning to render." />
      )}
    </div>
  );
}

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h3
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: '0 0 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      {label}
    </h3>
  );
}

function BlockLabel({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      {text}
    </div>
  );
}

function PositioningBlock({
  label,
  value,
  italic = false,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div
      style={{
        padding: 10,
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PricingCell({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'danger';
}) {
  const borderColor = tone === 'danger' ? 'rgba(220,38,38,0.35)' : 'var(--border-color)';
  const labelColor = tone === 'danger' ? 'var(--error, #DC2626)' : 'var(--text-muted)';
  return (
    <div
      style={{
        padding: 10,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: labelColor,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        padding: 10,
        border: '1px dashed var(--border-color)',
        borderRadius: 6,
      }}
    >
      {text}
    </div>
  );
}
