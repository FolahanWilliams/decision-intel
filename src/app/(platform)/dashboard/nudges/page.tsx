'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NudgesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/decision-quality?tab=nudges'); }, [router]);
  return null;
}
