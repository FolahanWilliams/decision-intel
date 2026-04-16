const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
};

interface ResearchCitationCardProps {
  authorMonogram: string;
  authors: string;
  title: string;
  year: string;
  connection: string;
  featureName: string;
}

export function ResearchCitationCard({
  authorMonogram,
  authors,
  title,
  year,
  connection,
  featureName,
}: ResearchCitationCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '22px 22px 20px',
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.slate900} 0%, ${C.slate700} 100%)`,
            color: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
          aria-hidden
        >
          {authorMonogram}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.slate900,
              lineHeight: 1.3,
            }}
          >
            {authors}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.slate400,
              marginTop: 1,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {year}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: C.slate700,
          fontStyle: 'italic',
          lineHeight: 1.35,
        }}
      >
        {title}
      </div>

      <p
        style={{
          fontSize: 13,
          color: C.slate600,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {connection}
      </p>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 10,
          borderTop: `1px dashed ${C.slate200}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: C.slate400,
          }}
        >
          Powers
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: C.green,
            padding: '3px 10px',
            borderRadius: 999,
            background: C.greenLight,
          }}
        >
          {featureName}
        </span>
      </div>
    </div>
  );
}
