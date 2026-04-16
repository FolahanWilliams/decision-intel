export default function ProofLoading() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ background: '#0F172A', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div
            style={{
              width: 160,
              height: 14,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 4,
              marginBottom: 24,
            }}
          />
          <div
            style={{
              width: '80%',
              height: 56,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
          <div
            style={{
              width: '60%',
              height: 24,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 6,
            }}
          />
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 24,
            minHeight: 400,
          }}
        >
          {[0, 1].map(i => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                minHeight: 400,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
