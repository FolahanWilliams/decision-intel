export default function HowItWorksLoading() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ padding: '72px 24px 56px', background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 48,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                width: 180,
                height: 14,
                background: '#E2E8F0',
                borderRadius: 4,
                marginBottom: 24,
              }}
            />
            <div
              style={{
                width: '80%',
                height: 56,
                background: '#E2E8F0',
                borderRadius: 8,
                marginBottom: 16,
              }}
            />
            <div
              style={{
                width: '60%',
                height: 20,
                background: '#E2E8F0',
                borderRadius: 6,
              }}
            />
          </div>
          <div
            style={{
              height: 320,
              background: '#0F172A',
              borderRadius: 16,
            }}
          />
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px' }}>
        <div
          style={{
            height: 520,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 20,
          }}
        />
      </div>
    </div>
  );
}
