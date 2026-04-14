'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Brain, MessageSquare, Paperclip, X, FileText } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_QUESTIONS = [
  'Brainstorm LinkedIn posts for the Last-Mile Problem pillar',
  'Draft a YouTube hook about rubber-stamp executive committees',
  'What toxic combination case studies work best for content?',
  'Elevator pitch for a VP of Strategy or Head of M&A?',
  'Content ideas targeting corporate strategy and M&A teams',
  'How to frame Decision Intel for M&A teams without threatening egos?',
  'What Kahneman research supports the Decision Noise pillar?',
];

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx,.csv,.xlsx,.pptx,.html';

export function FounderChatWidget({ founderPass }: { founderPass: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachedFile) || streaming) return;
    const userMsg = input.trim() || (attachedFile ? `Analyze this file: ${attachedFile.name}` : '');
    const file = attachedFile;
    setInput('');
    setAttachedFile(null);

    const displayMsg = file ? `📎 ${file.name}\n${userMsg}` : userMsg;
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setStreaming(true);

    try {
      let res: Response;

      if (file) {
        // Send as FormData when file is attached
        const formData = new FormData();
        formData.append('message', userMsg);
        formData.append('history', JSON.stringify(messages.slice(-10)));
        formData.append('file', file);

        res = await fetch('/api/founder-hub/chat', {
          method: 'POST',
          headers: { 'x-founder-pass': founderPass },
          body: formData,
        });
      } else {
        res = await fetch('/api/founder-hub/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify({
            message: userMsg,
            history: messages.slice(-10),
          }),
        });
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const errMsg = errBody?.error || res.statusText || 'Failed to connect';
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
                assistantContent += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
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
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, founderPass, attachedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'File too large. Maximum size is 10 MB.' },
        ]);
        return;
      }
      setAttachedFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#16A34A',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
          zIndex: 50,
          fontSize: 22,
        }}
        title="Ask the Founder AI"
      >
        <MessageSquare size={22} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 'min(400px, calc(100vw - 32px))',
        height: 'min(520px, calc(100vh - 96px))',
        maxWidth: 400,
        maxHeight: 520,
        borderRadius: 16,
        background: 'var(--bg-secondary, #111)',
        border: '1px solid var(--border-primary, #333)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-primary, #333)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(22, 163, 74, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} style={{ color: '#16A34A' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Founder AI
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 10px',
              color: 'var(--text-muted)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Ask me about content strategy, LinkedIn/YouTube ideas, pillar topics, competitor
            positioning, or research frameworks. You can also upload files (pitch decks, memos,
            documents) for analysis.
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'center',
                marginTop: 10,
              }}
            >
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 12,
                    border: '1px solid var(--border-primary, #333)',
                    background: 'transparent',
                    color: '#16A34A',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#16A34A' : 'var(--bg-tertiary, #1a1a1a)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached file chip */}
      {attachedFile && (
        <div
          style={{
            padding: '4px 12px',
            borderTop: '1px solid var(--border-primary, #333)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <FileText size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {attachedFile.name}
          </span>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            {(attachedFile.size / 1024).toFixed(0)}KB
          </span>
          <button
            onClick={() => setAttachedFile(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: attachedFile ? 'none' : '1px solid var(--border-primary, #333)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          hidden
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={streaming}
          title="Attach a file (PDF, DOCX, PPTX, etc.)"
          style={{
            background: 'none',
            border: 'none',
            color: attachedFile ? '#16A34A' : 'var(--text-muted)',
            cursor: streaming ? 'wait' : 'pointer',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Paperclip size={16} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={attachedFile ? 'Add a message about this file...' : 'Ask the Founder AI...'}
          disabled={streaming}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--border-primary, #333)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={streaming || (!input.trim() && !attachedFile)}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background:
              (input.trim() || attachedFile) && !streaming
                ? '#16A34A'
                : 'var(--bg-tertiary, #1a1a1a)',
            color: (input.trim() || attachedFile) && !streaming ? '#fff' : 'var(--text-muted)',
            cursor: streaming ? 'wait' : 'pointer',
          }}
        >
          {streaming ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
