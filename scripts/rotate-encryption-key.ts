/**
 * Encryption Key Rotation CLI.
 *
 * Walks every row whose keyVersion column points at the "from" version,
 * decrypts with the old key, re-encrypts with the new key, and updates
 * the row in-place. Runs in batches, idempotent on re-run, safe to
 * interrupt and resume.
 *
 * Usage:
 *   npm run rotate:encryption-key -- --domain document --from 1 --to 2
 *   npm run rotate:encryption-key -- --domain slack --from 1 --to 2 --batch 50
 *   npm run rotate:encryption-key -- --domain document --from 1 --to 2 --dry-run
 *
 * Before running:
 *   1. Provision the new key at the target version, e.g.
 *      DOCUMENT_ENCRYPTION_KEY_V2=<64-char-hex>
 *   2. Bump the current-version env if you want new writes to use it:
 *      DOCUMENT_ENCRYPTION_KEY_VERSION=2
 *   3. Deploy. At this point new writes use v2, existing rows still on v1.
 *   4. Run this script. Each successful batch is committed in its own
 *      transaction — a crash mid-run only loses the current batch.
 *   5. After every row is on v2, drop the v1 env var. Next deploy.
 *
 * This file is imported by `package.json`'s rotate:encryption-key script.
 * It reads DATABASE_URL, DOCUMENT_ENCRYPTION_KEY_V{N}, and
 * SLACK_TOKEN_ENCRYPTION_KEY_V{N} from the environment.
 */

/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import {
  decryptDocumentContent,
  encryptDocumentContent,
  decryptToken,
  encryptToken,
  getResolvableKeyVersions,
  type KeyDomain,
} from '../src/lib/utils/encryption';

interface Args {
  domain: KeyDomain;
  from: number;
  to: number;
  batchSize: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { batchSize: 100, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    if (flag === '--domain') {
      if (next !== 'document' && next !== 'slack') {
        throw new Error('--domain must be "document" or "slack"');
      }
      args.domain = next;
      i++;
    } else if (flag === '--from') {
      args.from = parseInt(next, 10);
      i++;
    } else if (flag === '--to') {
      args.to = parseInt(next, 10);
      i++;
    } else if (flag === '--batch') {
      args.batchSize = parseInt(next, 10);
      i++;
    } else if (flag === '--dry-run') {
      args.dryRun = true;
    }
  }
  if (!args.domain) throw new Error('--domain is required');
  if (!Number.isFinite(args.from)) throw new Error('--from is required (integer)');
  if (!Number.isFinite(args.to)) throw new Error('--to is required (integer)');
  if (args.from === args.to) throw new Error('--from and --to cannot be equal');
  if (!Number.isFinite(args.batchSize) || args.batchSize! < 1) {
    throw new Error('--batch must be a positive integer');
  }
  return args as Args;
}

function assertKeysAvailable(domain: KeyDomain, from: number, to: number) {
  const resolvable = getResolvableKeyVersions(domain);
  const missing = [from, to].filter(v => !resolvable.includes(v));
  if (missing.length) {
    throw new Error(
      `Missing key versions for domain="${domain}": v${missing.join(', v')}. ` +
        `Resolvable: ${resolvable.length ? resolvable.map(v => `v${v}`).join(', ') : 'none'}.\n` +
        `Provision the required env vars before rotating — see src/lib/utils/encryption.ts header.`
    );
  }
}

async function rotateDocuments(prisma: PrismaClient, args: Args) {
  // "rows with from-version" means: keyVersion === from
  // OR (keyVersion IS NULL AND from === 1). This lets the caller migrate
  // legacy unstamped rows onto an explicit version without a separate pass.
  const legacyMatch = args.from === 1;
  let processed = 0;
  let batchCount = 0;
  /* eslint-disable no-constant-condition */
  while (true) {
    const rows = await prisma.document.findMany({
      where: legacyMatch
        ? { OR: [{ contentKeyVersion: args.from }, { contentKeyVersion: null }] }
        : { contentKeyVersion: args.from },
      select: {
        id: true,
        contentEncrypted: true,
        contentIv: true,
        contentTag: true,
        contentKeyVersion: true,
      },
      take: args.batchSize,
      orderBy: { id: 'asc' },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!row.contentEncrypted || !row.contentIv || !row.contentTag) {
        // Legacy-plaintext-only rows — nothing to re-encrypt. Stamp the
        // version so the next pass doesn't keep seeing them.
        if (!args.dryRun) {
          await prisma.document.update({
            where: { id: row.id },
            data: { contentKeyVersion: args.to },
          });
        }
        processed++;
        continue;
      }
      const plaintext = decryptDocumentContent({
        contentEncrypted: row.contentEncrypted,
        contentIv: row.contentIv,
        contentTag: row.contentTag,
        contentKeyVersion: row.contentKeyVersion,
      });
      if (args.dryRun) {
        processed++;
        continue;
      }
      // Force encryption to use the target version by temporarily
      // swapping the VERSION env. We restore it on finally so a crash
      // mid-run can't permanently repoint the process.
      const prev = process.env.DOCUMENT_ENCRYPTION_KEY_VERSION;
      process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = String(args.to);
      try {
        const encrypted = encryptDocumentContent(plaintext);
        await prisma.document.update({
          where: { id: row.id },
          data: {
            contentEncrypted: encrypted.contentEncrypted,
            contentIv: encrypted.contentIv,
            contentTag: encrypted.contentTag,
            contentKeyVersion: encrypted.contentKeyVersion,
          },
        });
      } finally {
        if (prev === undefined) delete process.env.DOCUMENT_ENCRYPTION_KEY_VERSION;
        else process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = prev;
      }
      processed++;
    }
    batchCount++;
    console.log(`  batch ${batchCount}: processed ${rows.length} (running total: ${processed})`);
  }
  return processed;
}

async function rotateSlackInstallations(prisma: PrismaClient, args: Args) {
  const legacyMatch = args.from === 1;
  let processed = 0;
  let batchCount = 0;
  while (true) {
    const rows = await prisma.slackInstallation.findMany({
      where: legacyMatch
        ? { OR: [{ botTokenKeyVersion: args.from }, { botTokenKeyVersion: null }] }
        : { botTokenKeyVersion: args.from },
      select: {
        id: true,
        botTokenEncrypted: true,
        botTokenIv: true,
        botTokenTag: true,
        botTokenKeyVersion: true,
      },
      take: args.batchSize,
      orderBy: { id: 'asc' },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      const plaintext = decryptToken({
        botTokenEncrypted: row.botTokenEncrypted,
        botTokenIv: row.botTokenIv,
        botTokenTag: row.botTokenTag,
        botTokenKeyVersion: row.botTokenKeyVersion,
      });
      if (args.dryRun) {
        processed++;
        continue;
      }
      const prev = process.env.SLACK_TOKEN_ENCRYPTION_KEY_VERSION;
      process.env.SLACK_TOKEN_ENCRYPTION_KEY_VERSION = String(args.to);
      try {
        const encrypted = encryptToken(plaintext);
        await prisma.slackInstallation.update({
          where: { id: row.id },
          data: {
            botTokenEncrypted: encrypted.botTokenEncrypted,
            botTokenIv: encrypted.botTokenIv,
            botTokenTag: encrypted.botTokenTag,
            botTokenKeyVersion: encrypted.botTokenKeyVersion,
          },
        });
      } finally {
        if (prev === undefined) delete process.env.SLACK_TOKEN_ENCRYPTION_KEY_VERSION;
        else process.env.SLACK_TOKEN_ENCRYPTION_KEY_VERSION = prev;
      }
      processed++;
    }
    batchCount++;
    console.log(`  batch ${batchCount}: processed ${rows.length} (running total: ${processed})`);
  }
  return processed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assertKeysAvailable(args.domain, args.from, args.to);
  console.log(
    `Rotating ${args.domain} keys from v${args.from} → v${args.to} ` +
      `(batch size ${args.batchSize}${args.dryRun ? ', DRY RUN' : ''})`
  );
  const prisma = new PrismaClient();
  try {
    const processed =
      args.domain === 'document'
        ? await rotateDocuments(prisma, args)
        : await rotateSlackInstallations(prisma, args);
    console.log(
      `\nDone. ${processed} row${processed === 1 ? '' : 's'} ${
        args.dryRun ? 'would have been' : ''
      } rotated from v${args.from} to v${args.to}.`
    );
    if (!args.dryRun && processed > 0) {
      console.log(
        `\nNext: verify no rows remain at v${args.from} before removing the ` +
          `DOCUMENT_ENCRYPTION_KEY_V${args.from} / SLACK_TOKEN_ENCRYPTION_KEY_V${args.from} ` +
          `env var from production.`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Rotation failed:', err);
  process.exit(1);
});
