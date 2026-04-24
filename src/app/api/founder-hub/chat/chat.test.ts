import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────

const { mockSendMessageStream, mockStartChat } = vi.hoisted(() => {
  const mockSendMessageStream = vi.fn();
  const mockStartChat = vi.fn((_opts?: Record<string, unknown>) => ({
    sendMessageStream: mockSendMessageStream,
  }));
  return { mockSendMessageStream, mockStartChat };
});

vi.mock('@google/generative-ai', () => {
  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return { startChat: mockStartChat };
    }
  }
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE' },
  };
});

vi.mock('@/lib/env', () => ({
  getRequiredEnvVar: vi.fn(() => 'fake-api-key'),
  getOptionalEnvVar: vi.fn((_key: string, fallback: string) => fallback),
}));

vi.mock('@/lib/sse', () => ({
  formatSSE: vi.fn((data: unknown) => `data: ${JSON.stringify(data)}\n\n`),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

// The route calls buildRecentMeetingsBlock() on every request. When a
// DB is reachable in CI with seed rows, the helper returns a non-empty
// string and the chat injects TWO extra history entries (the meetings
// snapshot + model ack), breaking the deterministic history-length
// assertions below. Mock to empty by default; individual tests can
// override via mockBuildRecentMeetingsBlock.mockResolvedValueOnce(...).
const mockBuildRecentMeetingsBlock = vi.fn(() => Promise.resolve(''));
vi.mock('@/lib/founder-hub/recent-meetings-context', () => ({
  buildRecentMeetingsBlock: () => mockBuildRecentMeetingsBlock(),
}));

import { POST } from './route';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body: unknown, founderPass?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (founderPass) headers['x-founder-pass'] = founderPass;
  return new NextRequest(new URL('http://localhost/api/founder-hub/chat'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

const PASS = 'test-founder-pass-123';

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value);
  }
  return result;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env.FOUNDER_HUB_PASS = PASS;
  delete process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;

  // Default: successful stream with one chunk
  const mockStream = {
    async *[Symbol.asyncIterator]() {
      yield { text: () => 'Hello from AI' };
    },
    stream: (async function* () {
      yield { text: () => 'Hello from AI' };
    })(),
  };
  mockSendMessageStream.mockResolvedValue(mockStream);
});

describe('POST /api/founder-hub/chat', () => {
  it('returns 503 when FOUNDER_HUB_PASS is not set', async () => {
    delete process.env.FOUNDER_HUB_PASS;
    delete process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;
    const res = await POST(makeRequest({ message: 'hello' }, 'anything'));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('Not configured');
  });

  it('returns 401 when x-founder-pass header is missing', async () => {
    const res = await POST(makeRequest({ message: 'hello' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when x-founder-pass header is wrong', async () => {
    const res = await POST(makeRequest({ message: 'hello' }, 'wrong-password'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when passwords differ in length', async () => {
    const res = await POST(makeRequest({ message: 'hello' }, 'short'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when message is empty', async () => {
    const res = await POST(makeRequest({ message: '' }, PASS));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('message is required');
  });

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeRequest({}, PASS));
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is not a string', async () => {
    const res = await POST(makeRequest({ message: 123 }, PASS));
    expect(res.status).toBe(400);
  });

  it('returns SSE stream with correct headers on success', async () => {
    const res = await POST(makeRequest({ message: 'What is DQI?' }, PASS));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
    expect(res.headers.get('Connection')).toBe('keep-alive');
  });

  it('streams chunks and done event', async () => {
    const res = await POST(makeRequest({ message: 'What is DQI?' }, PASS));
    const text = await readStream(res);
    expect(text).toContain('chunk');
    expect(text).toContain('done');
  });

  it('passes history to Gemini chat', async () => {
    const history = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];
    await POST(makeRequest({ message: 'Follow up', history }, PASS));
    expect(mockStartChat).toHaveBeenCalledWith(
      expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({ role: 'user', parts: [{ text: 'Hello' }] }),
          expect.objectContaining({ role: 'model', parts: [{ text: 'Hi there' }] }),
        ]),
      })
    );
  });

  it('filters invalid history entries', async () => {
    const history = [
      { role: 'user', content: 'Valid' },
      { bad: 'entry' },
      null,
      42,
      { role: 'user', content: 'Also valid' },
    ];
    await POST(makeRequest({ message: 'Test', history }, PASS));
    expect(mockStartChat).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatArgs = (mockStartChat as any).mock.calls[0]?.[0] as
      | { history: Array<{ role: string; parts?: Array<{ text: string }> }> }
      | undefined;
    expect(chatArgs).toBeDefined();
    // At minimum, the 2 valid history entries should be present
    expect(chatArgs!.history.length).toBeGreaterThanOrEqual(4); // system pair + 2 valid
  });

  it('truncates history to last 20 entries', async () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    await POST(makeRequest({ message: 'Test', history }, PASS));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatArgs = (mockStartChat as any).mock.calls[0]?.[0] as
      | { history: Array<unknown> }
      | undefined;
    expect(chatArgs).toBeDefined();
    // System pair (2) + last 20 history entries
    expect(chatArgs!.history.length).toBe(22);
  });

  it('truncates message to 5000 chars', async () => {
    const longMessage = 'x'.repeat(10000);
    await POST(makeRequest({ message: longMessage }, PASS));
    expect(mockSendMessageStream).toHaveBeenCalledWith('x'.repeat(5000));
  });

  describe('response-style sanitizer', () => {
    function makeStream(parts: string[]) {
      return {
        stream: (async function* () {
          for (const p of parts) yield { text: () => p };
        })(),
      };
    }

    async function runWith(parts: string[]): Promise<string> {
      mockSendMessageStream.mockResolvedValue(makeStream(parts));
      const res = await POST(makeRequest({ message: 'test' }, PASS));
      const raw = await readStream(res);
      // Extract concatenated chunk texts from the SSE payloads
      const lines = raw.split('\n').filter(l => l.startsWith('data: '));
      let out = '';
      for (const line of lines) {
        const obj = JSON.parse(line.slice(6));
        if (obj.type === 'chunk' && typeof obj.text === 'string') out += obj.text;
      }
      return out;
    }

    it('strips markdown bold delimiters within a single chunk', async () => {
      const out = await runWith(['Hello **world** done']);
      expect(out).toBe('Hello world done');
    });

    it('strips markdown bold delimiters split across chunks', async () => {
      const out = await runWith(['Hello **wo', 'rld** done']);
      expect(out).toBe('Hello world done');
    });

    it('handles a single trailing asterisk across boundaries', async () => {
      // Reconstructed stream content is 'Hello ** world **end**'; stripping
      // the two bold pairs leaves a double-space between Hello and world.
      const out = await runWith(['Hello *', '* world **end**']);
      expect(out).toBe('Hello  world end');
    });

    it('replaces em dash with comma space', async () => {
      const out = await runWith(['Yes\u2014absolutely']);
      expect(out).toBe('Yes, absolutely');
    });

    it('replaces en dash with comma space', async () => {
      const out = await runWith(['Yes\u2013absolutely']);
      expect(out).toBe('Yes, absolutely');
    });

    it('strips underscore bold delimiters', async () => {
      const out = await runWith(['Hello __world__ done']);
      expect(out).toBe('Hello world done');
    });

    it('flushes trailing held character on stream end', async () => {
      const out = await runWith(['done*']);
      expect(out).toBe('done*');
    });
  });
});
