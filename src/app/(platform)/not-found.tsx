import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PlatformNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 text-center px-6">
        <p
          className="text-8xl font-bold tracking-tighter select-none"
          style={{
            color: 'var(--text-primary)',
            opacity: 0.15,
            lineHeight: 1,
          }}
        >
          404
        </p>

        <h1 className="text-2xl font-semibold -mt-4" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>

        <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium transition-colors"
          style={{
            color: 'var(--bg-primary)',
            background: 'var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
