import { AlertTriangle, Shield } from 'lucide-react';

/** Styles the detectableRedFlags array as a ranked alert list — the kind of
 *  thing the live product would render above the fold. */
export function DemoRedFlagsAlert({ flags }: { flags: string[] }) {
  if (!flags.length) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#DC2626',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Shield size={12} />
        Platform-detected signals
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
        {flags.length} red flag{flags.length === 1 ? '' : 's'} in the document
      </h2>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
        Each flag below was detectable from the document text alone. No outcome data. No hindsight.
      </p>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #FCA5A5',
          borderRadius: 16,
          padding: '8px',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.08)',
        }}
      >
        {flags.map((flag, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '14px 12px',
              borderBottom: i < flags.length - 1 ? '1px solid #FEE2E2' : 'none',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#FEE2E2',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <AlertTriangle size={10} style={{ marginBottom: 1 }} />
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: '#0F172A', lineHeight: 1.55 }}>{flag}</div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#991B1B',
                  marginTop: 4,
                }}
              >
                Critical · Detectable at decision time
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
