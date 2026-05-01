/**
 * Input validation for /api/journal.
 *
 * Derives the request-body schema from the generated `JournalEntrySchema`
 * (auto-produced by zod-prisma-types from prisma/schema.prisma) so a Prisma
 * field rename / type tighten is a compile error here, not a runtime 500.
 *
 * See `src/lib/validation/README.md` for the canonical pattern.
 */

import { z } from 'zod';
import { JournalEntrySchema } from '@/generated/zod';

export const CreateJournalEntrySchema = JournalEntrySchema.pick({
  title: true,
  content: true,
  participants: true,
}).extend({
  // Tighten the loose `String` columns into discriminated unions.
  source: z.enum(['email_forward', 'calendar_webhook', 'manual', 'slack_digest']),
  sourceRef: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  // Length caps beyond what Prisma's column type expresses — protects against
  // accidental 10MB pastes hitting the DB write path.
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required').max(100_000),
  // .pick keeps participants as `z.string().array()` from the generated schema;
  // cap the array length so a hostile client can't enqueue 10K participant rows.
  participants: z.array(z.string().max(200)).max(100).optional().default([]),
});

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;
