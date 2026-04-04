'use client';

import { useCallback } from 'react';
import { Loader2, Copy, Save, Edit3, Linkedin, Twitter, FileText, Quote } from 'lucide-react';
import { card, sectionTitle } from '../shared-styles';

const CONTENT_TYPES = [
  { id: 'linkedin_post', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2' },
  { id: 'twitter_thread', label: 'Twitter/X', icon: Twitter, color: '#1d9bf0' },
  { id: 'blog_draft', label: 'Blog Draft', icon: FileText, color: '#22c55e' },
  { id: 'snippet', label: 'Snippet', icon: Quote, color: '#f59e0b' },
] as const;

interface ContentGeneratorProps {
  founderPass: string;
  contentType: string;
  setContentType: (t: string) => void;
  topic: string;
  setTopic: (t: string) => void;
  generatedContent: string;
  setGeneratedContent: (c: string) => void;
  isGenerating: boolean;
  setIsGenerating: (g: boolean) => void;
  tone: string;
  voiceNotes: string;
  onSave: (content: string) => void;
  isEditing: boolean;
  setIsEditing: (e: boolean) => void;
}

export function ContentGenerator({
  founderPass,
  contentType,
  setContentType,
  topic,
  setTopic,
  generatedContent,
  setGeneratedContent,
  isGenerating,
  setIsGenerating,
  tone,
  voiceNotes,
  onSave,
  isEditing,
  setIsEditing,
}: ContentGeneratorProps) {
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedContent('');
    setIsEditing(false);

    try {
      const res = await fetch('/api/founder-hub/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-pass': founderPass,
        },
        body: JSON.stringify({
          action: 'generate',
          contentType,
          topic: topic.trim() || undefined,
          tone,
          voiceNotes: voiceNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setGeneratedContent('Error: Failed to generate content.');
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setIsGenerating(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.text) {
                accumulated += data.text;
                setGeneratedContent(accumulated);
              }
            } catch {
              // malformed SSE line
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch {
      setGeneratedContent('Error: Network error during generation.');
    } finally {
      setIsGenerating(false);
    }
  }, [founderPass, contentType, topic, tone, voiceNotes, isGenerating, setIsGenerating, setGeneratedContent, setIsEditing]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedContent);
  }, [generatedContent]);

  return (
    <div style={card}>
      <div style={{ ...sectionTitle, marginBottom: 16 }}>✍️ Generate Content</div>

      {/* Content type selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {CONTENT_TYPES.map(ct => {
          const Icon = ct.icon;
          const active = contentType === ct.id;
          return (
            <button
              key={ct.id}
              onClick={() => setContentType(ct.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: active ? `2px solid ${ct.color}` : '2px solid var(--border-primary, #222)',
                background: active ? `${ct.color}15` : 'transparent',
                color: active ? ct.color : 'var(--text-secondary, #a1a1aa)',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {ct.label}
            </button>
          );
        })}
      </div>

      {/* Topic input */}
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Topic or angle (optional — leave blank for general decision intelligence content)"
        maxLength={1000}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border-primary, #222)',
          background: 'var(--bg-primary, #0a0a0a)',
          color: 'var(--text-primary, #fff)',
          fontSize: 13,
          marginBottom: 16,
          fontFamily: 'inherit',
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !isGenerating) handleGenerate();
        }}
      />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 24px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          border: 'none',
          background: isGenerating ? '#166534' : '#16a34a',
          color: '#fff',
          opacity: isGenerating ? 0.7 : 1,
          transition: 'all 0.15s',
          marginBottom: generatedContent ? 16 : 0,
        }}
      >
        {isGenerating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>

      {/* Preview / Edit */}
      {generatedContent && (
        <div>
          <div style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid var(--border-primary, #222)',
            background: 'var(--bg-primary, #0a0a0a)',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--text-primary, #fff)',
            whiteSpace: 'pre-wrap',
            maxHeight: 500,
            overflowY: 'auto',
            position: 'relative',
          }}>
            {isEditing ? (
              <textarea
                value={generatedContent}
                onChange={e => setGeneratedContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 300,
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            ) : (
              <>
                {generatedContent}
                {isGenerating && (
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 16,
                    background: '#16a34a',
                    marginLeft: 2,
                    animation: 'pulse 1s ease-in-out infinite',
                    verticalAlign: 'text-bottom',
                  }} />
                )}
              </>
            )}
          </div>

          {/* Action bar */}
          {!isGenerating && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border-primary, #222)',
                  background: isEditing ? '#16a34a20' : 'transparent',
                  color: isEditing ? '#16a34a' : 'var(--text-secondary, #a1a1aa)',
                }}
              >
                <Edit3 size={12} />
                {isEditing ? 'Done Editing' : 'Edit'}
              </button>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border-primary, #222)',
                  background: 'transparent',
                  color: 'var(--text-secondary, #a1a1aa)',
                }}
              >
                <Copy size={12} />
                Copy
              </button>
              <button
                onClick={() => onSave(generatedContent)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid #16a34a40',
                  background: '#16a34a15',
                  color: '#16a34a',
                }}
              >
                <Save size={12} />
                Save to Library
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
