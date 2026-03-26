'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CopilotRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/ai-assistant?mode=copilot'); }, [router]);
  return null;
}
