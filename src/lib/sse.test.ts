import { describe, it, expect, vi } from 'vitest';
import { SSEReader, formatSSE } from './sse';

describe('formatSSE', () => {
    it('formats data correctly', () => {
        const output = formatSSE({ foo: 'bar' });
        expect(output).toBe('data: {"foo":"bar"}\n\n');
    });

    it('handles circular references safely', () => {
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
        expect(callback).toHaveBeenCalledWith({ val: 1 });
    });

    it('buffers partial events', () => {
        const reader = new SSEReader();
        const callback = vi.fn();
        reader.processChunk('data: {"val":', callback);
        expect(callback).not.toHaveBeenCalled();
        reader.processChunk(' 1}\n\n', callback);
        expect(callback).toHaveBeenCalledWith({ val: 1 });
    });

    it('handles multiple events in one chunk', () => {
        const reader = new SSEReader();
        const callback = vi.fn();
        reader.processChunk('data: {"a": 1}\n\ndata: {"b": 2}\n\n', callback);
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, { a: 1 });
        expect(callback).toHaveBeenNthCalledWith(2, { b: 2 });
    });

    it('ignores partial JSON at end if not double-newline', () => {
        const reader = new SSEReader();
        const callback = vi.fn();
        reader.processChunk('data: {"a": 1}\n\ndata: {', callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({ a: 1 });
        // The second one waits
    });
});
