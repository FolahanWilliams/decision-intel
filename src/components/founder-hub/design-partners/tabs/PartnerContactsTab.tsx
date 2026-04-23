'use client';

/**
 * Partner detail — Contacts & Meeting Prep tab.
 *
 * Two responsibilities:
 * 1. Saved contacts list — people at this partner the founder is in
 *    touch with. Each row shows name + role + generated-prep status
 *    + expand to read the plan. Delete per row.
 * 2. "Add a contact" form — paste LinkedIn info for a specific person
 *    (e.g. the investment partner at Sankore). On submit, the contact
 *    is created and the "Generate meeting prep" button appears.
 *    Clicking Generate streams the Gemini plan into the row and
 *    persists on completion.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Wand2,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';
import type { Application, PartnerContact } from '../types';

const log = createLogger('PartnerContactsTab');

interface Props {
  app: Application;
  founderPass: string;
}

export function PartnerContactsTab({ app, founderPass }: Props) {
  const [contacts, setContacts] = useState<PartnerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-founder-pass': founderPass,
    }),
    [founderPass]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/founder-hub/design-partners/${app.id}/contacts`, {
        headers: authHeaders(),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to load contacts');
      setContacts(body.data.contacts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [app.id, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteContact = async (id: string) => {
    if (!confirm('Remove this contact? This also deletes the saved meeting-prep plan.')) return;
    const prev = contacts;
    setContacts(c => c.filter(x => x.id !== id));
    try {
      const res = await fetch(`/api/founder-hub/design-partners/${app.id}/contacts/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
    } catch (err) {
      setContacts(prev);
      setError((err as Error).message);
    }
  };

  const generatePrep = async (contactId: string) => {
    setGeneratingId(contactId);
    setError(null);
    // Optimistically clear any existing plan so the user sees the
    // live-stream take over in place.
    setContacts(c =>
      c.map(x => (x.id === contactId ? { ...x, generatedPrep: '', generatedAt: null } : x))
    );
    try {
      const res = await fetch(
        `/api/founder-hub/design-partners/${app.id}/contacts/${contactId}/generate-prep`,
        {
          method: 'POST',
          headers: authHeaders(),
        }
      );
      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(errBody.error || 'Generation failed');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE framing: split by double-newline, parse each event's
        // "data:" line as JSON.
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const ev of events) {
          const dataLine = ev.split('\n').find(l => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const msg = JSON.parse(dataLine.slice(6)) as {
              type?: string;
              text?: string;
              message?: string;
            };
            if (msg.type === 'chunk' && msg.text) {
              accumulated += msg.text;
              setContacts(c =>
                c.map(x => (x.id === contactId ? { ...x, generatedPrep: accumulated } : x))
              );
            }
            if (msg.type === 'error' && msg.message) {
              setError(msg.message);
            }
          } catch (parseErr) {
            log.warn('Failed to parse SSE chunk:', parseErr);
          }
        }
      }
      // Reload the contact row so generatedAt stamps and any server-
      // side corrections come through.
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: '0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={14} />
          People at {app.company} ({contacts.length})
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Paste a LinkedIn profile for each specific person you&rsquo;ll be meeting. Generate a
          tailored meeting-prep plan grounded in this partner&rsquo;s context — the plan is saved so
          you can re-open without re-spending tokens.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 6,
            color: 'var(--error, #DC2626)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />
          Loading contacts…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contacts.map(c => (
            <ContactRow
              key={c.id}
              contact={c}
              onGenerate={() => generatePrep(c.id)}
              onDelete={() => deleteContact(c.id)}
              isGenerating={generatingId === c.id}
            />
          ))}
          {contacts.length === 0 && !showAdd && (
            <div
              style={{
                padding: 20,
                border: '1px dashed var(--border-color)',
                borderRadius: 8,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12.5,
              }}
            >
              No contacts yet. Add the first person you&rsquo;ll be meeting at {app.company}.
            </div>
          )}
        </div>
      )}

      {showAdd ? (
        <AddContactForm
          partnerId={app.id}
          founderPass={founderPass}
          onClose={() => setShowAdd(false)}
          onCreated={newContact => {
            setContacts(c => [newContact, ...c]);
            setShowAdd(false);
          }}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 'var(--radius-full, 999px)',
            border: '1px solid var(--accent-primary)',
            background: 'transparent',
            color: 'var(--accent-primary)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Add a contact
        </button>
      )}
    </div>
  );
}

function ContactRow({
  contact,
  onGenerate,
  onDelete,
  isGenerating,
}: {
  contact: PartnerContact;
  onGenerate: () => void;
  onDelete: () => void;
  isGenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
            {contact.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {contact.role}
            {contact.linkedInUrl && (
              <a
                href={contact.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent-primary)',
                  marginLeft: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                LinkedIn <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
        {contact.generatedPrep && contact.generatedAt && !isGenerating && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--success, #16A34A)',
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(22,163,74,0.1)',
            }}
          >
            Prep saved
          </span>
        )}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 999,
            border: `1px solid ${isGenerating ? 'var(--border-color)' : 'var(--accent-primary)'}`,
            background: isGenerating ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
            color: isGenerating ? 'var(--text-muted)' : 'var(--text-on-accent, #fff)',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: isGenerating ? 'default' : 'pointer',
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 size={12} />
              {contact.generatedPrep ? 'Re-generate' : 'Generate meeting prep'}
            </>
          )}
        </button>
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
          aria-label="Remove contact"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {(contact.generatedPrep || isGenerating) && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: 'none',
              borderTop: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {expanded ? 'Hide plan' : 'Show plan'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {expanded && (
            <pre
              style={{
                margin: 0,
                padding: 14,
                background: 'var(--bg-card)',
                fontSize: 12.5,
                lineHeight: 1.65,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                borderTop: '1px solid var(--border-color)',
                maxHeight: 520,
                overflow: 'auto',
              }}
            >
              {contact.generatedPrep || '…'}
            </pre>
          )}
        </>
      )}

      {!contact.generatedPrep && !isGenerating && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-color)',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
          }}
        >
          No meeting-prep plan yet. Click &ldquo;Generate meeting prep&rdquo; to stream a tailored
          plan grounded in {contact.name}&rsquo;s LinkedIn info and this partner&rsquo;s rich
          profile.
        </div>
      )}
    </div>
  );
}

function AddContactForm({
  partnerId,
  founderPass,
  onClose,
  onCreated,
}: {
  partnerId: string;
  founderPass: string;
  onClose: () => void;
  onCreated: (c: PartnerContact) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInInfo, setLinkedInInfo] = useState('');
  const [meetingContext, setMeetingContext] = useState('');
  const [founderAsk, setFounderAsk] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (linkedInInfo.trim().length < 40) {
      setError('Paste at least 40 characters of LinkedIn info.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/founder-hub/design-partners/${partnerId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-pass': founderPass,
        },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          linkedInUrl: linkedInUrl.trim() || undefined,
          linkedInInfo: linkedInInfo.trim(),
          meetingContext: meetingContext.trim() || undefined,
          founderAsk: founderAsk.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to create');
      onCreated(body.data.contact);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--accent-primary)',
        borderRadius: 8,
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          Add a contact
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 11,
            padding: 4,
          }}
        >
          Cancel
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <Field label="Full name" value={name} onChange={setName} placeholder="Titi Odunfa Adeoye" />
        <Field
          label="Role / title"
          value={role}
          onChange={setRole}
          placeholder="CEO, Sankore Investments"
        />
      </div>
      <Field
        label="LinkedIn URL (optional)"
        value={linkedInUrl}
        onChange={setLinkedInUrl}
        placeholder="https://www.linkedin.com/in/..."
      />
      <Field
        label="LinkedIn info (required — paste About + role summary)"
        sublabel="≥40 characters. The more concrete the better — the prep generator reads this verbatim."
        value={linkedInInfo}
        onChange={setLinkedInInfo}
        textarea
        rows={6}
        placeholder="Paste the About section, recent roles, stated priorities, any recent posts that matter…"
      />
      <Field
        label="Meeting context (optional)"
        sublabel="How the meeting came to be + what's already been promised. Defaults to a sensible stub."
        value={meetingContext}
        onChange={setMeetingContext}
        textarea
        rows={3}
        placeholder="Warm intro via family friend. Scheduled next week. I've promised a Decision Provenance Record specimen as follow-up."
      />
      <Field
        label="Your ask (optional)"
        sublabel="What does a win look like from THIS specific meeting?"
        value={founderAsk}
        onChange={setFounderAsk}
        textarea
        rows={3}
        placeholder="Commitment to a 30-day pilot at £1,999/mo, or a historical memo for a free DPR specimen within 7 days."
      />

      {error && <div style={{ fontSize: 11.5, color: 'var(--error, #DC2626)' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          onClick={submit}
          disabled={submitting || !name.trim() || !role.trim() || linkedInInfo.trim().length < 40}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: 'none',
            background:
              submitting || !name.trim() || !role.trim() || linkedInInfo.trim().length < 40
                ? 'var(--bg-tertiary)'
                : 'var(--accent-primary)',
            color:
              submitting || !name.trim() || !role.trim() || linkedInInfo.trim().length < 40
                ? 'var(--text-muted)'
                : 'var(--text-on-accent, #fff)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor:
              submitting || !name.trim() || !role.trim() || linkedInInfo.trim().length < 40
                ? 'default'
                : 'pointer',
          }}
        >
          {submitting ? 'Saving…' : 'Save contact'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  sublabel,
  value,
  onChange,
  placeholder,
  textarea = false,
  rows,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  const shared: React.CSSProperties = {
    width: '100%',
    padding: 10,
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
  };
  return (
    <div>
      <label
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {sublabel && (
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--text-muted)',
            marginBottom: 6,
            lineHeight: 1.45,
          }}
        >
          {sublabel}
        </div>
      )}
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 4}
          style={{ ...shared, resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={shared}
        />
      )}
    </div>
  );
}
