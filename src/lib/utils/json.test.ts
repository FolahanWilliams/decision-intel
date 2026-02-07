import { describe, it, expect } from 'vitest';
import { parseJSON, safeStringify, safeJsonClone } from './json';

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

describe('safeStringify', () => {
    it('handles BigInt by converting to string', () => {
        const obj = { val: BigInt(9007199254740991) };
        expect(safeStringify(obj)).toBe('{"val":"9007199254740991"}');
    });

    it('handles Circular references', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a: any = { name: 'root' };
        a.self = a;
        // First usage of safeStringify might return [Circular] string or full structure depending on where recursion happens
        // {"name":"root","self":"[Circular]"}
        const json = safeStringify(a);
        expect(json).toContain('"self":"[Circular]"');
    });

    it('handles standard objects', () => {
        expect(safeStringify({ a: 1 })).toBe('{"a":1}');
    });

    it('handles valid Dates', () => {
        const d = new Date('2023-01-01T00:00:00.000Z');
        expect(safeStringify({ d })).toBe('{"d":"2023-01-01T00:00:00.000Z"}');
    });
});

describe('safeJsonClone', () => {
    it('clones standard objects', () => {
        const obj = { a: 1, b: 'test', c: true, d: null };
        expect(safeJsonClone(obj)).toEqual(obj);
        expect(safeJsonClone(obj)).not.toBe(obj);
    });

    it('converts BigInt to string', () => {
        const obj = { val: BigInt(123) };
        expect(safeJsonClone(obj)).toEqual({ val: '123' });
    });

    it('converts Date to ISO string', () => {
        const d = new Date('2023-01-01T00:00:00.000Z');
        expect(safeJsonClone({ d })).toEqual({ d: '2023-01-01T00:00:00.000Z' });
    });

    it('handles Circular references by replacing with string', () => {
        const a: Record<string, unknown> = { name: 'root' };
        a.self = a;
        const cloned = safeJsonClone(a);
        expect(cloned.name).toBe('root');
        expect(cloned.self).toBe('[Circular]');
    });

    it('strips undefined, function, symbol from objects', () => {
        const obj = {
            a: 1,
            b: undefined,
            c: () => { },
            d: Symbol('sym')
        };
        const cloned = safeJsonClone(obj);
        expect(cloned).toEqual({ a: 1 });
        expect('b' in cloned).toBe(false);
    });

    it('converts undefined, function, symbol to null in arrays', () => {
        const arr = [1, undefined, () => { }, Symbol('sym'), 2];
        const cloned = safeJsonClone(arr);
        expect(cloned).toEqual([1, null, null, null, 2]);
    });

    it('respects .toJSON() method', () => {
        const obj = {
            val: 1,
            toJSON() {
                return { replaced: true };
            }
        };
        // Expectation: safeJsonClone calls toJSON, so it returns { replaced: true }
        // BUT safeJsonClone uses JSON.parse(JSON.stringify(obj)).
        // JSON.stringify calls toJSON.
        // So { val: 1, toJSON... } becomes '{"replaced":true}' -> { replaced: true }
        expect(safeJsonClone(obj)).toEqual({ replaced: true });
    });

    it('handles .toJSON() returning BigInt (via nesting)', () => {
        const obj = {
            toJSON() {
                return { b: BigInt(123) };
            }
        };
        // JSON.stringify calls toJSON -> returns { b: BigInt(123) }.
        // Then stringify proceeds with { b: BigInt(123) }.
        // It should convert BigInt to string (if using safeStringify).
        expect(safeJsonClone(obj)).toEqual({ b: '123' });
    });

    it('handles deep structures', () => {
        const obj = {
            a: {
                b: {
                    c: [1, { d: BigInt(99) }]
                }
            }
        };
        expect(safeJsonClone(obj)).toEqual({
            a: {
                b: {
                    c: [1, { d: '99' }]
                }
            }
        });
    });
});
