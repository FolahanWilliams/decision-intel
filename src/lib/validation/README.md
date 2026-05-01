# API Input Validation

Zod schemas for validating client input on `/api/*` POST/PATCH/PUT routes.

## Convention

1. **Generated schemas** (`@/generated/zod`) are the canonical "shape of a Prisma model" — auto-derived from `prisma/schema.prisma` via `zod-prisma-types` on every `prisma generate`. Use them as the base.

2. **Hand-written input schemas** live here (`src/lib/validation/<route-slug>.ts`) and DERIVE from the generated model schemas by `.pick()` + `.extend()`. Tighten loose string columns into enums, add length limits, drop server-managed fields (id / userId / createdAt / etc.).

3. **Routes** import from `@/lib/validation/<route-slug>` and call `Schema.safeParse(body)` after `request.json()`.

## Why

Yesterday's outage came from a runtime `PrismaClientValidationError` against a `Document.visibility` column that didn't accept null. The compile-time guard on the access helpers caught the next instance — this directory is the same idea applied to API request bodies. When a Prisma field is renamed or its type narrows, `.pick({ field: true })` becomes a compile error, not a runtime 500 in production.

## Pattern

```ts
// src/lib/validation/journal.ts
import { z } from 'zod';
import { JournalEntrySchema } from '@/generated/zod';

export const CreateJournalEntrySchema = JournalEntrySchema.pick({
  title: true,
  content: true,
  participants: true,
}).extend({
  source: z.enum(['email_forward', 'calendar_webhook', 'manual', 'slack_digest']),
  sourceRef: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  // Narrow lengths beyond what Prisma expresses:
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(100_000),
});

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;
```

```ts
// src/app/api/journal/route.ts
import { CreateJournalEntrySchema } from '@/lib/validation/journal';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateJournalEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }
  const { title, content /* ... */ } = parsed.data;
  // ...
}
```

## Forward-looking rule

When adding a new POST/PATCH route that writes to Prisma, write the input schema HERE first (deriving from the generated model schema), then wire the route. Greenfield routes should NOT hand-write input schemas without referencing the generated schema — the whole point is the lockstep guarantee.
