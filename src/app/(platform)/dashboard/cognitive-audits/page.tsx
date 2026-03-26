'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CognitiveAuditsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/decision-quality?tab=audits'); }, [router]);
  return null;
}
