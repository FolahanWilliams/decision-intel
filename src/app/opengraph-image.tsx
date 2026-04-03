import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Decision Intel — The Decision Performance OS for M&A & Investment Teams';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f23 100%)',
        padding: '60px 80px',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Shield icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(59, 130, 246, 0.15))',
          border: '1px solid rgba(22, 163, 74, 0.3)',
          marginBottom: 32,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="rgba(22, 163, 74, 0.6)"
            stroke="rgba(129, 140, 248, 0.8)"
            strokeWidth="1.5"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-1px',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        Decision Intel
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 24,
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.4,
        }}
      >
        AI-Powered Cognitive Bias Auditing for M&amp;A &amp; Investment Teams
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #16A34A, #3b82f6, #16A34A)',
        }}
      />
    </div>,
    { ...size }
  );
}
