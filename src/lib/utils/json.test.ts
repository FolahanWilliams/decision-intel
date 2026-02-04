import { describe, it, expect } from 'vitest';
import { parseJSON } from './json';

describe('Robust parseJSON', () => {
    it('parses valid JSON object', () => {
        expect(parseJSON('{"foo": "bar"}')).toEqual({ foo: 'bar' });
    });

    it('extracts JSON from markdown fences', () => {
        const input = 'Here is the data:\n```json\n{"a": 1}\n```';
        expect(parseJSON(input)).toEqual({ a: 1 });
    });

    it('extracts JSON array from text', () => {
        const input = 'Result: [1, 2, 3] end';
        expect(parseJSON(input)).toEqual([1, 2, 3]);
    });

    it('handles nested braces', () => {
        const input = '{"a": {"b": 2}}';
        expect(parseJSON(input)).toEqual({ a: { b: 2 } });
    });

    it('ignores braces in strings', () => {
        const input = '{"msg": "Hello { world }"}';
        expect(parseJSON(input)).toEqual({ msg: 'Hello { world }' });
    });

    it('handles escaped quotes', () => {
        const input = '{"msg": "Hello \\"world\\""}';
        expect(parseJSON(input)).toEqual({ msg: 'Hello "world"' });
    });

    it('returns null on invalid JSON', () => {
        expect(parseJSON('Hello world')).toBeNull();
    });

    it('returns null on broken JSON', () => {
        expect(parseJSON('{"foo": ')).toBeNull(); // truncated
    });
});
