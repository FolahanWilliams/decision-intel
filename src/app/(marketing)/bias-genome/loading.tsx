export default function BiasGenomeLoading() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              width: 220,
              height: 14,
              background: '#E2E8F0',
              borderRadius: 4,
              marginBottom: 24,
            }}
          />
          <div
            style={{
              width: '72%',
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
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                minHeight: 180,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
