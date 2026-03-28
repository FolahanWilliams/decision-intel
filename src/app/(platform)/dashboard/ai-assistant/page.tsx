'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, MessageSquare } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabBar } from '@/components/ui/TabBar';
import { CopilotPageContent } from '@/components/copilot/CopilotPageContent';
import { ChatPageContent } from '@/components/chat/ChatPageContent';

const TABS = [
  { key: 'copilot', label: 'Decision Copilot', icon: <Sparkles size={15} /> },
  { key: 'chat', label: 'Document Chat', icon: <MessageSquare size={15} /> },
];

function AIAssistantInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') === 'chat' ? 'chat' : 'copilot';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 44px)' }}>
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <TabBar
          tabs={TABS}
          activeTab={mode}
          onTabChange={key =>
            router.replace(`/dashboard/ai-assistant?mode=${key}`, { scroll: false })
          }
        />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {mode === 'copilot' ? <CopilotPageContent /> : <ChatPageContent />}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <ErrorBoundary sectionName="AI Assistant">
      <Suspense fallback={null}>
        <AIAssistantInner />
      </Suspense>
    </ErrorBoundary>
  );
}
