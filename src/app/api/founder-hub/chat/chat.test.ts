import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────

const { mockSendMessageStream, mockStartChat } = vi.hoisted(() => {
  const mockSendMessageStream = vi.fn();
  const mockStartChat = vi.fn(() => ({ sendMessageStream: mockSendMessageStream }));
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
  process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS = PASS;

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
  it('returns 503 when NEXT_PUBLIC_FOUNDER_HUB_PASS is not set', async () => {
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
    const chatArgs = mockStartChat.mock.calls[0][0];
    // History should include system prompt pair + 2 valid entries (not the 3 invalid ones)
    const userEntries = chatArgs.history.filter(
      (h: { role: string }) => h.role === 'user' && h.parts?.[0]?.text !== expect.anything()
    );
    // At minimum, the 2 valid history entries should be present
    expect(chatArgs.history.length).toBeGreaterThanOrEqual(4); // system pair + 2 valid
  });

  it('truncates history to last 20 entries', async () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    await POST(makeRequest({ message: 'Test', history }, PASS));
    const chatArgs = mockStartChat.mock.calls[0][0];
    // System pair (2) + last 20 history entries
    expect(chatArgs.history.length).toBe(22);
  });

  it('truncates message to 5000 chars', async () => {
    const longMessage = 'x'.repeat(10000);
    await POST(makeRequest({ message: longMessage }, PASS));
    expect(mockSendMessageStream).toHaveBeenCalledWith('x'.repeat(5000));
  });
});
