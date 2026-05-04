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
  /** True once the user explicitly clicks End (or the hard 30-min cap
   *  fires). Lets the Disconnected handler distinguish a clean end
   *  from a server-side disconnect — the latter is an error condition
   *  worth surfacing in the panel rather than silently unmounting. */
  const userInitiatedEndRef = useRef<boolean>(false);
  /** Cleared once the agent participant joins. Lets the no-agent
   *  watchdog tell the founder "Railway worker isn't joining the room"
   *  instead of leaving the panel stuck on "Connecting...". */
  const agentJoinedRef = useRef<boolean>(false);
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
    userInitiatedEndRef.current = true;
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
        // TTS track. Three settings are load-bearing here:
        //   1. autoplay — required so the element starts playing the
        //      moment livekit-client's track.attach pipes a stream into
        //      it. The mic-click gesture authorizes autoplay for this
        //      tab; without autoplay the founder would have to click
        //      a play button after every greeting.
        //   2. playsinline — required by Safari (incl. macOS Safari +
        //      iOS WebKit). Without it, attaching an audio track on
        //      Safari can either silently no-op or trigger a fullscreen
        //      media controller, neither of which we want.
        //   3. document.body.appendChild — DETACHED audio elements (not
        //      in the DOM) can fail to play on Safari and some Chrome
        //      configs even with autoplay=true. Appending is free, the
        //      element has no visual footprint, and it's the LiveKit JS
        //      SDK's recommended pattern. Cleanup removes it on unmount.
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        audioEl.setAttribute('playsinline', 'true');
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;

        // Audio-progress diagnostics: log when actual audio data arrives
        // and progresses. play() can resolve successfully on a stream
        // that produces ZERO audio data — readyState stays at 0, the
        // user hears silence, and we have no signal that anything is
        // wrong unless we listen for these events.
        let lastTimeUpdate = 0;
        audioEl.addEventListener('loadedmetadata', () => {
          console.log(
            '[VoiceModePanel] audio loadedmetadata —',
            `duration=${audioEl.duration}`,
            `readyState=${audioEl.readyState}`
          );
        });
        audioEl.addEventListener('canplay', () => {
          console.log('[VoiceModePanel] audio canplay — buffer has enough data to start');
        });
        audioEl.addEventListener('playing', () => {
          console.log('[VoiceModePanel] audio playing — actually emitting sound now');
        });
        audioEl.addEventListener('waiting', () => {
          console.warn('[VoiceModePanel] audio waiting — playback paused waiting for more data');
        });
        audioEl.addEventListener('stalled', () => {
          console.warn('[VoiceModePanel] audio stalled — no data arriving');
        });
        audioEl.addEventListener('ended', () => {
          console.log('[VoiceModePanel] audio ended — track finished');
        });
        audioEl.addEventListener('error', (e) => {
          console.error(
            '[VoiceModePanel] audio error —',
            audioEl.error?.code,
            audioEl.error?.message
          );
        });
        audioEl.addEventListener('timeupdate', () => {
          // Throttle to once per second so the console isn't spammed
          if (audioEl.currentTime - lastTimeUpdate >= 1.0) {
            console.log(
              `[VoiceModePanel] audio timeupdate — currentTime=${audioEl.currentTime.toFixed(2)}s ` +
                `paused=${audioEl.paused} ended=${audioEl.ended}`
            );
            lastTimeUpdate = audioEl.currentTime;
          }
        });

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
        // hidden audio element so the founder hears it. Verbose
        // logging so we can pin "no audio" failures precisely:
        //   - TrackSubscribed never fires → agent never published a track
        //     (worker issue, NOT a browser issue)
        //   - fires but kind != Audio → enum comparison bug
        //   - fires, kind matches, attach OK, play() rejects → autoplay
        //     policy blocked playback (UI fix needed)
        //   - all of the above succeed but still no sound → output device
        //     issue (system-side, not code)
        room.on(
          RoomEvent.TrackSubscribed,
          (
            track: { kind: string; attach: (el: HTMLAudioElement) => void; sid?: string },
            publication?: { trackName?: string; trackSid?: string },
            participant?: { identity?: string }
          ) => {
            console.log(
              '[VoiceModePanel] TrackSubscribed —',
              `kind=${track.kind}`,
              `expectedKind=${Track.Kind.Audio}`,
              `match=${track.kind === Track.Kind.Audio}`,
              `participantIdentity=${participant?.identity}`,
              `trackName=${publication?.trackName}`,
              `trackSid=${publication?.trackSid ?? track.sid}`
            );
            // Flip the "agent joined" ref here too — if we got an
            // audio track from a remote, the remote IS connected by
            // definition (Track 2 of the watchdog-defeat).
            agentJoinedRef.current = true;
            if (track.kind === Track.Kind.Audio) {
              try {
                track.attach(audioEl);
                console.log(
                  '[VoiceModePanel] audio attached to <audio> element —',
                  `inDOM=${document.body.contains(audioEl)}`,
                  `paused=${audioEl.paused}`,
                  `readyState=${audioEl.readyState}`,
                  `volume=${audioEl.volume}`,
                  `muted=${audioEl.muted}`
                );
              } catch (attachErr) {
                console.error('[VoiceModePanel] track.attach threw:', attachErr);
              }
              audioEl
                .play()
                .then(() => {
                  console.log(
                    '[VoiceModePanel] audio.play() resolved — playing now. paused=',
                    audioEl.paused
                  );
                })
                .catch(playErr => {
                  console.error(
                    '[VoiceModePanel] audio.play() rejected — browser autoplay policy may have blocked playback. ' +
                      'name=' +
                      (playErr as Error).name +
                      ' message=' +
                      (playErr as Error).message
                  );
                });
            }
          }
        );

        // Verbose log for every other interesting room event so we can
        // see the full lifecycle when debugging "no audio" symptoms.
        room.on(RoomEvent.TrackPublished, (publication: { trackName?: string; kind?: string }, participant: { identity?: string }) => {
          console.log(
            '[VoiceModePanel] TrackPublished —',
            `participantIdentity=${participant?.identity}`,
            `trackName=${publication?.trackName}`,
            `kind=${publication?.kind}`
          );
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: { kind: string }, publication: { trackName?: string }, participant: { identity?: string }) => {
          console.log(
            '[VoiceModePanel] TrackUnsubscribed —',
            `participantIdentity=${participant?.identity}`,
            `trackName=${publication?.trackName}`,
            `kind=${track?.kind}`
          );
        });

        // Mark agent as joined as soon as ANY remote participant
        // arrives — that's our Railway worker. The 'no agent joined'
        // watchdog below uses this ref to distinguish a stuck panel
        // from a real session in progress.
        //
        // CRITICAL: ParticipantConnected does NOT fire for participants
        // already in the room when this listener is registered. The
        // voice worker dispatches faster than the browser can join
        // (Railway worker → LiveKit dispatch → join room runs faster
        // than browser → fetch /voice-token → wss handshake → publish
        // mic). So by the time we attach this listener, the agent is
        // typically already a remote participant. ParticipantConnected
        // never fires. agentJoinedRef stays false. The 10s watchdog
        // below fires a "no agent joined" disconnect that the user
        // experiences as voice mode auto-ending after exactly 10s.
        //
        // Three guards now flip agentJoinedRef:
        //   1. ParticipantConnected event (late-joining agent)
        //   2. TrackSubscribed event (the agent published audio — they
        //      had to be connected to do that, so they count as joined)
        //   3. Initial scan after connect (catches the race where the
        //      agent joined before our listener registration)
        room.on(RoomEvent.ParticipantConnected, () => {
          agentJoinedRef.current = true;
        });

        room.on(RoomEvent.Disconnected, (reason?: unknown) => {
          if (cancelled) return;
          // Distinguish user-initiated end (clean handoff to text chat)
          // from server-side disconnect (worker crash / room timeout /
          // network drop). The latter should surface a specific error
          // in the panel rather than silently unmounting it — silent
          // unmount was the 2026-05-04 "panel disappears" bug class.
          if (userInitiatedEndRef.current) {
            onEnd([...transcriptRef.current, ...flushTranscript()]);
            return;
          }
          const detail = typeof reason === 'string' ? ` (${reason})` : '';
          if (!agentJoinedRef.current) {
            setError(
              `Voice agent never joined the room${detail}. Most likely cause: the Railway worker isn't dispatching into this LiveKit project. Check Railway logs for [voice-worker] session start lines + verify LIVEKIT_URL matches between Vercel and Railway.`
            );
          } else {
            setError(
              `Voice session ended unexpectedly${detail}. Check the Railway worker logs for the most recent [voice-worker] error.`
            );
          }
          setStatus('error');
        });

        // Step 3: connect, publish microphone.
        await room.connect(tokenData.livekitUrl, tokenData.token);
        if (cancelled) {
          await room.disconnect();
          return;
        }

        // Race-defeat for the watchdog: scan existing remote
        // participants. If the agent was already in the room when
        // we registered the ParticipantConnected listener, that
        // event never fires. Without this scan, the watchdog at 10s
        // sees agentJoinedRef.current === false and disconnects the
        // session — which the founder experiences as voice mode
        // auto-ending exactly 10 seconds after starting.
        // (Track 3 of the watchdog-defeat — the explicit init scan.)
        const remoteCount = (room as unknown as { remoteParticipants?: Map<string, unknown> })
          .remoteParticipants?.size ?? 0;
        if (remoteCount > 0) {
          agentJoinedRef.current = true;
          console.log(
            '[VoiceModePanel] post-connect scan — agent already in room, agentJoinedRef set true. remoteCount=',
            remoteCount
          );
        } else {
          console.log(
            '[VoiceModePanel] post-connect scan — no remote participants yet, will rely on TrackSubscribed/ParticipantConnected'
          );
        }

        await room.localParticipant.setMicrophoneEnabled(true);

        sessionStartRef.current = Date.now();
        setStatus('connected');

        // Watchdog: if no agent joins within 10 seconds of connecting,
        // surface a clear error pointing at the Railway worker. Without
        // this, the panel sits forever on 'connected' showing 0:00 and
        // no captions — which looks like a UI bug but is actually
        // "your worker isn't being dispatched."
        setTimeout(() => {
          if (cancelled) return;
          if (agentJoinedRef.current) return;
          if (userInitiatedEndRef.current) return;
          setError(
            'Voice agent did not join within 10 seconds. The Railway worker is either not running, not registered with your LiveKit project, or env vars (LIVEKIT_URL / VOICE_WORKER_SECRET / MAIN_APP_URL) are mismatched. Check Railway logs and the LiveKit Cloud Sessions tab.'
          );
          setStatus('error');
          // Drop the room so we stop billing for the empty session.
          userInitiatedEndRef.current = true;
          void roomRef.current?.disconnect().catch(err => {
            console.warn('[VoiceModePanel] watchdog disconnect:', err);
          });
        }, 10_000);
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
