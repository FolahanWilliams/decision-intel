import { describe, it, expect } from 'vitest';
import { extractTicketFromContent } from './ticket-extractor';

describe('extractTicketFromContent', () => {
  it('extracts a deal value from an M&A announcement', () => {
    const t = extractTicketFromContent(
      'Today we announced the acquisition of SmallCo for $3.2 billion in an all-cash deal.'
    );
    expect(t).not.toBeNull();
    expect(t!.amount).toBe(3_200_000_000);
    expect(t!.currency).toBe('USD');
    expect(t!.tier).toBe('commitment');
  });

  it('extracts capex commitments', () => {
    const t = extractTicketFromContent(
      'The board approved $450 million in capital expenditure for the new plant.'
    );
    expect(t!.amount).toBe(450_000_000);
    expect(t!.tier).toBe('commitment');
  });

  it('handles GBP and EUR symbols', () => {
    expect(extractTicketFromContent('a takeover valued at £800 million')!.currency).toBe('GBP');
    expect(extractTicketFromContent('raising €1.5 billion in a new round')!.currency).toBe('EUR');
  });

  it('prefers the largest COMMITMENT figure over a bare valuation', () => {
    // A $200B market cap sits in the text, but the DECISION is a $5B acquisition.
    const t = extractTicketFromContent(
      'The company, with a market cap of $200 billion, is acquiring a rival for $5 billion.'
    );
    expect(t!.amount).toBe(5_000_000_000);
    expect(t!.tier).toBe('commitment');
  });

  it('falls back to a valuation when no commitment figure exists', () => {
    const t = extractTicketFromContent('The startup is valued at $2 billion after the round.');
    expect(t!.amount).toBe(2_000_000_000);
    expect(t!.tier).toBe('valuation');
  });

  it('ignores sub-$1M figures and context-free numbers', () => {
    expect(
      extractTicketFromContent('The CEO earns $500,000 and the office costs $1,200 a month.')
    ).toBeNull();
    expect(extractTicketFromContent('We shipped $50 million of product.')).toBeNull(); // no decision context
  });

  it('returns null on empty / no-money input', () => {
    expect(extractTicketFromContent('')).toBeNull();
    expect(extractTicketFromContent('A strategic memo with no figures.')).toBeNull();
  });

  it('picks the largest deal when several are present', () => {
    const t = extractTicketFromContent(
      'We will acquire A for $1 billion, B for $4 billion, and C for $2 billion.'
    );
    expect(t!.amount).toBe(4_000_000_000);
  });
});
