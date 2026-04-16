import { Network } from 'lucide-react';

/** Named archetype for the decision (e.g. "Founder Hubris + Capital Abundance").
 *  Rendered as a chip in the case-study detail page header. */
export function PatternFamilyBadge({ family }: { family: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: 'linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 100%)',
        color: '#5B21B6',
        border: '1px solid #C4B5FD',
        padding: '4px 10px',
        borderRadius: 999,
      }}
    >
      <Network size={11} />
      {family}
    </span>
  );
}
