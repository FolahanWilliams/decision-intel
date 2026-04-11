'use client';

import { useState, useEffect, useCallback } from 'react';
import { VoiceConfig } from './content-studio/VoiceConfig';
import { ContentGenerator } from './content-studio/ContentGenerator';
import { ContentLibrary } from './content-studio/ContentLibrary';
import { CaseStudyPicker } from './content-studio/CaseStudyPicker';
import { CaseStudyAnalyzer } from './content-studio/CaseStudyAnalyzer';
import { ContentOpportunities } from './content-studio/ContentOpportunities';
import { WeeklyBrief } from './content-studio/WeeklyBrief';
import { ContentPerformanceWidget } from './content-studio/ContentPerformanceWidget';
import type { CaseStudy } from '@/lib/data/case-studies/types';

const STORAGE_KEY = 'founder-content-studio-voice';

interface ContentItem {
  id: string;
  contentType: string;
  title: string;
  body: string;
  topic: string | null;
  tone: string | null;
  status: string;
  createdAt: string;
}

interface ContentStudioTabProps {
  founderPass: string;
}

export function ContentStudioTab({ founderPass }: ContentStudioTabProps) {
  // Voice config state (persisted to localStorage)
  const [tone, setTone] = useState('authoritative');
  const [voiceNotes, setVoiceNotes] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);

  // Generation state
  const [contentType, setContentType] = useState('linkedin_post');
  const [pillar, setPillar] = useState('');
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Library state
  const [savedItems, setSavedItems] = useState<ContentItem[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Case study visual generator state
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);

  // Hydrate voice config from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tone) setTone(parsed.tone);
        if (parsed.voiceNotes) setVoiceNotes(parsed.voiceNotes);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist voice config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tone, voiceNotes }));
    } catch {
      // ignore
    }
  }, [tone, voiceNotes]);

  // Fetch library
  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/founder-hub/content?${params.toString()}`, {
        headers: { 'x-founder-pass': founderPass },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data.items || []);
      }
    } catch {
      // silent
    } finally {
      setLibraryLoading(false);
    }
  }, [founderPass, filterType, filterStatus]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Save handler
  const handleSave = useCallback(
    async (content: string) => {
      const title = content.split('\n')[0]?.slice(0, 100) || 'Untitled';

      try {
        const res = await fetch('/api/founder-hub/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify({
            action: 'save',
            contentType,
            title,
            body: content,
            topic: pillar
              ? `[pillar:${pillar}] ${topic.trim() || 'general'}`
              : topic.trim() || undefined,
            tone,
            status: 'draft',
          }),
        });

        if (res.ok) {
          fetchLibrary();
        }
      } catch {
        // silent
      }
    },
    [founderPass, contentType, pillar, topic, tone, fetchLibrary]
  );

  const handleDraft = useCallback(
    (draftType: string, draftTopic: string) => {
      setContentType(draftType);
      setTopic(draftTopic);
      setGeneratedContent('');
      setTimeout(() => {
        document.getElementById('content-generator-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    },
    []
  );

  return (
    <div>
      <WeeklyBrief founderPass={founderPass} onDraft={handleDraft} />

      <ContentOpportunities founderPass={founderPass} onDraft={handleDraft} />

      <VoiceConfig
        tone={tone}
        setTone={setTone}
        voiceNotes={voiceNotes}
        setVoiceNotes={setVoiceNotes}
        isOpen={voiceOpen}
        setIsOpen={setVoiceOpen}
      />

      <div id="content-generator-anchor" />
      <ContentGenerator
        founderPass={founderPass}
        contentType={contentType}
        setContentType={setContentType}
        pillar={pillar}
        setPillar={setPillar}
        topic={topic}
        setTopic={setTopic}
        generatedContent={generatedContent}
        setGeneratedContent={setGeneratedContent}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        tone={tone}
        voiceNotes={voiceNotes}
        onSave={handleSave}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />

      {selectedCaseStudy ? (
        <CaseStudyAnalyzer
          caseStudy={selectedCaseStudy}
          onBack={() => setSelectedCaseStudy(null)}
          onUseInPost={caseTopic => {
            setTopic(caseTopic);
            setPillar('toxic_combos');
            setSelectedCaseStudy(null);
          }}
          founderPass={founderPass}
        />
      ) : (
        <CaseStudyPicker onSelectCase={setSelectedCaseStudy} />
      )}

      <ContentLibrary
        founderPass={founderPass}
        items={savedItems}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onRefresh={fetchLibrary}
        loading={libraryLoading}
      />

      <ContentPerformanceWidget />
    </div>
  );
}
