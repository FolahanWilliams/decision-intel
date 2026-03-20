import { describe, it, expect, vi } from 'vitest';
import { SSEReader, formatSSE } from './sse';

describe('formatSSE', () => {
  it('formats data correctly', () => {
    const output = formatSSE({ foo: 'bar' });
    expect(output).toBe('data: {"foo":"bar"}\n\n');
  });

  it('handles circular references safely', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = { name: 'a' };
    a.self = a;
    const output = formatSSE(a);
    expect(output).toContain('"name":"a"');
    expect(output).toContain('[Circular]');
    expect(output).toContain('data: ');
    expect(output).toContain('\n\n');
  });
});

describe('SSEReader', () => {
  it('parses correct events', () => {
    const reader = new SSEReader();
    const callback = vi.fn();
    reader.processChunk('data: {"val": 1}\n\n', callback);
    expect(callback).toHaveBeenCalledWith({ val: 1 }, undefined);
  });

  it('buffers partial events', () => {
    const reader = new SSEReader();
    const callback = vi.fn();
    reader.processChunk('data: {"val":', callback);
    expect(callback).not.toHaveBeenCalled();
    reader.processChunk(' 1}\n\n', callback);
    expect(callback).toHaveBeenCalledWith({ val: 1 }, undefined);
  });

  it('handles multiple events in one chunk', () => {
    const reader = new SSEReader();
    const callback = vi.fn();
    reader.processChunk('data: {"a": 1}\n\ndata: {"b": 2}\n\n', callback);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, { a: 1 }, undefined);
    expect(callback).toHaveBeenNthCalledWith(2, { b: 2 }, undefined);
  });

  it('ignores partial JSON at end if not double-newline', () => {
    const reader = new SSEReader();
    const callback = vi.fn();
    reader.processChunk('data: {"a": 1}\n\ndata: {', callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ a: 1 }, undefined);
    // The second one waits
  });

  it('handles events with IDs', () => {
    const reader = new SSEReader();
    const callback = vi.fn();
    reader.processChunk('id: 123\ndata: {"val": 1}\n\n', callback);
    expect(callback).toHaveBeenCalledWith({ val: 1 }, '123');
    expect(reader.getLastEventId()).toBe('123');
  });

  it('tracks last event ID across chunks', () => {
    const reader = new SSEReader();
    const callback = vi.fn();
    reader.processChunk('id: 1\ndata: {"a": 1}\n\n', callback);
    reader.processChunk('id: 2\ndata: {"b": 2}\n\n', callback);
    expect(reader.getLastEventId()).toBe('2');
    expect(callback).toHaveBeenNthCalledWith(1, { a: 1 }, '1');
    expect(callback).toHaveBeenNthCalledWith(2, { b: 2 }, '2');
  });
});
