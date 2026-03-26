'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DecisionDNARedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/analytics?view=dna'); }, [router]);
  return null;
}
