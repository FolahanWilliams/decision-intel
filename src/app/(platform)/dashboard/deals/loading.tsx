export default function DealsLoading() {
  return (
    <div className="container" style={{ maxWidth: 1200, padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div
            style={{
              width: 160,
              height: 24,
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 6,
              animation: 'pulse 1.5s infinite',
            }}
          />
          <div
            style={{
              width: 100,
              height: 14,
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 4,
              marginTop: 8,
              animation: 'pulse 1.5s infinite',
            }}
          />
        </div>
        <div
          style={{
            width: 110,
            height: 36,
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 64,
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              animation: 'pulse 1.5s infinite',
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
