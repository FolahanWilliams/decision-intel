'use client';

/**
 * VoiceModePanel — owns the LiveKit room connection for voice mode.
 *
 * Renders inline within the FounderChatWidget chat shell when voice
 * mode is active (replaces the input row). Lazy-loaded so the
 * `livekit-client` bundle (~200KB) only ships to the browser when the
 * founder actually clicks the mic toggle, not on every chat-widget
 * mount.
 *
 * Lifecycle:
 *   1. POST /api/founder-hub/voice-token → JWT + room name + LiveKit URL
 *   2. Connect to LiveKit room, publish microphone track
 *   3. Worker auto-dispatches into the room, greets the founder
 *   4. Browser auto-plays the worker's TTS audio track
 *   5. TranscriptionReceived events stream live captions
 *   6. End: disconnect cleanly, hand the transcript back to the chat
 *      widget so the conversation continues in text
 *
 * Session caps:
 *   - Soft warning at 25 min (banner)
 *   - Hard disconnect at 30 min (matches JWT TTL + worker timeout)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import type { ThinkingPartner } from '@/lib/data/thinking-partners';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  persona: ThinkingPartner;
  founderPass: string;
  /** Called when the session ends. Receives the accumulated transcript
   *  so the parent chat widget can append it to its message history,
   *  preserving the conversation when the founder switches back to text. */
  onEnd: (transcript: ChatMsg[]) => void;
}

interface CaptionSegment {
  id: string;
  text: string;
  final: boolean;
  /** 'user' if the segment came from the founder's mic; 'assistant'
   *  if from the worker's TTS output. Determined by the participant
   *  identity attached to the TranscriptionReceived event. */
  role: 'user' | 'assistant';
}

const SESSION_HARD_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_WARNING_MS = 25 * 60 * 1000;

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceModePanel({ persona, founderPass, onEnd }: Props) {
  const [status, setStatus] = useState<
    'requesting' | 'connecting' | 'connected' | 'ending' | 'error'
  >('requesting');
  const [error, setError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [warningShown, setWarningShown] = useState(false);

  // Refs so the cleanup effect can reach the live LiveKit objects
  // without stale closures. The Room instance is created inside an
  // async effect; the ref bridges that to the cleanup path.
  // The Room type is imported lazily; we hold it as `unknown` and
  // narrow with the disconnect helper at cleanup time.
  const roomRef = useRef<{ disconnect: () => Promise<void> } | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<ChatMsg[]>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const captionsRef = useRef<CaptionSegment[]>([]);
  // captionsRef stays in sync with the `captions` state so the
  // pre-disconnect transcript flush sees the latest segments without
  // racing the React render.
  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);

  // Flatten the transcript on disconnect: take the last `final`
  // version of each segment, group by role, hand to onEnd. We keep
  // turn boundaries by role-runs (consecutive same-role segments
  // collapse into one ChatMsg).
  const flushTranscript = useCallback((): ChatMsg[] => {
    const finals = captionsRef.current.filter(c => c.final);
    const messages: ChatMsg[] = [];
    let current: ChatMsg | null = null;
    for (const seg of finals) {
      if (current && current.role === seg.role) {
        current.content += ' ' + seg.text;
      } else {
        if (current) messages.push(current);
        current = { role: seg.role, content: seg.text };
      }
    }
    if (current) messages.push(current);
    return messages;
  }, []);

  const endSession = useCallback(async () => {
    setStatus('ending');
    try {
      await roomRef.current?.disconnect();
    } catch (err) {
      // Server-side LiveKit room will GC after emptyTimeout regardless;
      // log at warn so we surface unexpected failures without breaking
      // the user-facing end flow (matches CLAUDE.md fire-and-forget
      // discipline — log, don't swallow).
      console.warn('[VoiceModePanel] endSession disconnect:', err);
    }
    onEnd([...transcriptRef.current, ...flushTranscript()]);
  }, [flushTranscript, onEnd]);

  // ── Connect on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        // Step 1: mint a token + create the room (server-side).
        setStatus('requesting');
        const tokenRes = await fetch('/api/founder-hub/voice-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify({ personaId: persona.id }),
        });
        if (!tokenRes.ok) {
          const errBody = (await tokenRes.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            errBody?.error || `Token mint failed: ${tokenRes.status} ${tokenRes.statusText}`
          );
        }
        const tokenData = (await tokenRes.json()) as {
          token: string;
          roomName: string;
          livekitUrl: string;
        };

        if (cancelled) return;

        // Step 2: dynamic-import livekit-client (~200KB) only now.
        setStatus('connecting');
        const lk = await import('livekit-client');
        const { Room, RoomEvent, Track } = lk;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room as unknown as { disconnect: () => Promise<void> };

        // Audio sink — attached lazily once the worker publishes its
        // TTS track. Browsers require a user gesture before autoplay,
        // which the click on the mic button satisfies.
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        audioElRef.current = audioEl;

        // Stream live captions. LiveKit's TranscriptionReceived event
        // fires for both the founder's STT and the worker's TTS — we
        // disambiguate by participant identity (the worker joins as
        // an agent participant; the founder joins as 'founder').
        room.on(
          RoomEvent.TranscriptionReceived,
          (
            segments: Array<{ id: string; text: string; final: boolean }>,
            participant?: { identity?: string },
          ) => {
            const role: 'user' | 'assistant' =
              participant?.identity === 'founder' ? 'user' : 'assistant';
            setCaptions(prev => {
              const map = new Map(prev.map(c => [c.id, c] as const));
              for (const seg of segments) {
                map.set(seg.id, { id: seg.id, text: seg.text, final: seg.final, role });
              }
              return Array.from(map.values()).slice(-50);
            });
          }
        );

        // Worker publishes its TTS audio as a track — attach to the
        // hidden audio element so the founder hears it.
        room.on(
          RoomEvent.TrackSubscribed,
          (track: { kind: string; attach: (el: HTMLAudioElement) => void }) => {
            if (track.kind === Track.Kind.Audio) {
              track.attach(audioEl);
            }
          }
        );

        room.on(RoomEvent.Disconnected, () => {
          if (cancelled) return;
          // Worker-initiated disconnect (e.g. hard timeout reached).
          // Hand back whatever transcript we've accumulated so the
          // chat widget can splice it into the message history.
          onEnd([...transcriptRef.current, ...flushTranscript()]);
        });

        // Step 3: connect, publish microphone.
        await room.connect(tokenData.livekitUrl, tokenData.token);
        if (cancelled) {
          await room.disconnect();
          return;
        }
        await room.localParticipant.setMicrophoneEnabled(true);

        sessionStartRef.current = Date.now();
        setStatus('connected');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Voice session failed';
        console.warn('[VoiceModePanel] connect failed:', err);
        setError(msg);
        setStatus('error');
      }
    }

    void connect();

    return () => {
      cancelled = true;
      // Best-effort cleanup. roomRef.current may be null if we crashed
      // before constructing the Room — that's fine, nothing to disconnect.
      // Already-disconnected rooms throw on second disconnect; log at
      // warn so we see it in dev but don't break the unmount.
      const room = roomRef.current;
      if (room) {
        room.disconnect().then(
          () => undefined,
          err => console.warn('[VoiceModePanel] disconnect during cleanup:', err)
        );
      }
      audioElRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only effect; persona switches reload the panel via parent remount
  }, [founderPass]);

  // ── Session timer + warning + hard cap ──────────────────────────────
  useEffect(() => {
    if (status !== 'connected') return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartRef.current;
      setElapsedMs(elapsed);
      if (!warningShown && elapsed >= SESSION_WARNING_MS) {
        setWarningShown(true);
      }
      if (elapsed >= SESSION_HARD_TIMEOUT_MS) {
        clearInterval(interval);
        void endSession();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status, warningShown, endSession]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current as unknown as {
      localParticipant?: { setMicrophoneEnabled: (on: boolean) => Promise<void> };
    } | null;
    if (!room?.localParticipant) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(micMuted);
      setMicMuted(!micMuted);
    } catch (err) {
      console.warn('[VoiceModePanel] mic toggle failed:', err);
    }
  }, [micMuted]);

  // ── Render ──────────────────────────────────────────────────────────
  const recentCaptions = useMemo(() => captions.slice(-3), [captions]);

  if (status === 'error') {
    return (
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-primary, #333)',
          background: `${persona.color}14`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--error)',
            fontSize: 12,
          }}
        >
          <AlertCircle size={14} />
          <span>{error || 'Voice session failed.'}</span>
        </div>
        <button
          type="button"
          onClick={() => onEnd([])}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            borderRadius: 8,
            border: '1px solid var(--border-primary, #333)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Back to text
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-primary, #333)',
        background: `${persona.color}10`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Live captions */}
      {recentCaptions.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${persona.color}30`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          {recentCaptions.map(seg => (
            <div
              key={seg.id}
              style={{
                fontSize: 11,
                lineHeight: 1.45,
                color:
                  seg.role === 'user' ? 'var(--text-primary)' : persona.color,
                fontStyle: seg.final ? 'normal' : 'italic',
                opacity: seg.final ? 1 : 0.65,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginRight: 6,
                  color: 'var(--text-muted)',
                }}
              >
                {seg.role === 'user' ? 'You' : persona.label}
              </span>
              {seg.text}
            </div>
          ))}
        </div>
      )}

      {/* Status + warning row */}
      {warningShown && status === 'connected' && (
        <div
          style={{
            padding: '6px 14px',
            background: 'rgba(245, 158, 11, 0.12)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--warning)',
            fontSize: 10,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Session ends at 30:00. Wrap up or keep going.
        </div>
      )}

      {/* Control bar */}
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {status === 'requesting' || status === 'connecting' || status === 'ending' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: 12,
              flex: 1,
            }}
          >
            <Loader2 size={14} className="voice-spin" style={{ color: persona.color }} />
            <span>
              {status === 'requesting'
                ? 'Setting up session...'
                : status === 'connecting'
                  ? `Connecting to ${persona.label}...`
                  : 'Ending session...'}
            </span>
          </div>
        ) : (
          <>
            {/* Mic mute toggle */}
            <button
              type="button"
              onClick={toggleMic}
              title={micMuted ? 'Unmute' : 'Mute'}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: micMuted ? 'var(--bg-tertiary, #1a1a1a)' : persona.color,
                color: micMuted ? 'var(--text-muted)' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Active indicator + persona name */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
              }}
            >
              <Volume2 size={12} style={{ color: persona.color, flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {persona.label} · live
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {formatElapsed(elapsedMs)}
              </span>
            </div>

            {/* End session */}
            <button
              type="button"
              onClick={endSession}
              title="End voice session"
              style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: 'var(--error)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <PhoneOff size={12} />
              End
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        :global(.voice-spin) {
          animation: voice-spin 1s linear infinite;
        }
        @keyframes voice-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
