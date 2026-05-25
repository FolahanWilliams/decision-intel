-- Secure share-link tokens (locked 2026-05-25, security audit)
--
-- Drops Prisma's @default(cuid()) on the three share-link tokens:
--   TeamInvite.token, ShareLink.token, GraphShareLink.token
--
-- Rationale: cuid v1 (Prisma's @default(cuid())) is collision-resistant
-- but uses Math.random() for its entropy segment — NOT cryptographically
-- secure. An attacker with an oracle to observe other cuids generated
-- nearby in time can narrow the brute-force search space materially.
--
-- After this migration:
--   - Token columns stay String + @unique (unchanged).
--   - Default value generator is dropped at the DB layer.
--   - Application code generates tokens via generateShareToken() in
--     src/lib/utils/share-token.ts (32-char base64url, 192 bits entropy).
--   - CREATE call sites pass `token: generateShareToken()` explicitly.
--
-- Existing rows (any TeamInvite / ShareLink / GraphShareLink already
-- carrying a cuid token) are UNAFFECTED. They remain valid; only new
-- token generation switches to the secure generator. If full rotation
-- of legacy tokens is later desired, a separate data migration ships
-- with explicit founder approval (would invalidate live share links).

ALTER TABLE "TeamInvite" ALTER COLUMN "token" DROP DEFAULT;
ALTER TABLE "ShareLink" ALTER COLUMN "token" DROP DEFAULT;
ALTER TABLE "GraphShareLink" ALTER COLUMN "token" DROP DEFAULT;
