import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseFile } from '@/lib/utils/file-parser';
import { createHash, createHmac } from 'crypto';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { isFileTypeSupported } from '@/lib/constants/file-types';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { resolveUserFromToken } from '@/lib/integrations/email/token';

const log = createLogger('EmailInbound');

/** Always return 200 to Resend to prevent retries. */
const OK = () => NextResponse.json({ received: true }, { status: 200 });

interface InboundAttachment {
  filename: string;
  content: string; // base64
  contentType: string;
}

interface InboundEmailPayload {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: InboundAttachment[];
}

/**
 * Verify the Resend webhook signature using the shared secret.
 * Checks svix-id, svix-timestamp, and svix-signature headers.
 */
function verifyWebhookSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    log.warn('RESEND_WEBHOOK_SECRET not configured — skipping signature verification');
    return true; // Allow in development
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    log.error('Missing svix webhook headers');
    return false;
  }

  // Verify timestamp is within 5 minutes to prevent replay attacks
  const timestampSeconds = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampSeconds) > 300) {
    log.error('Webhook timestamp too old or in the future');
    return false;
  }

  // Compute HMAC-SHA256 signature: base64(HMAC-SHA256(secret, "${svix-id}.${svix-timestamp}.${body}"))
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  // Resend/Svix secrets are prefixed with "whsec_" and base64-encoded
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');

  // Svix sends multiple signatures separated by space; check if any match
  const signatures = svixSignature.split(' ');
  const hmac = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  return signatures.some((sig: string) => {
    const sigValue = sig.replace(/^v1,/, '');
    return sigValue === hmac;
  });
}

/**
 * Extract the user token from the "to" email address.
 * Expected format: analyze+{token}@in.decision-intel.com
 */
function extractTokenFromAddress(to: string): string | null {
  const match = to.match(/analyze\+([a-zA-Z0-9_-]+)@/);
  return match?.[1] ?? null;
}

/**
 * Send a confirmation email back to the sender using the existing Resend pattern.
 */
async function sendConfirmationEmail(
  toEmail: string,
  documentCount: number,
  fromSubject: string
): Promise<void> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    log.warn('[DRY RUN] Confirmation email not sent (RESEND_API_KEY not configured)');
    return;
  }

  const EMAIL_FROM = process.env.EMAIL_FROM || 'Decision Intel <notifications@decisionintel.app>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const subject = `Received: ${fromSubject || 'your forwarded document'}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="margin: 0 0 16px; color: #fff;">Document Received</h2>
        <p style="color: #94a3b8; margin: 0 0 20px;">
          We received ${documentCount} document${documentCount !== 1 ? 's' : ''} from your forwarded email
          and ${documentCount !== 1 ? 'they are' : 'it is'} now being analyzed.
        </p>

        <a href="${appUrl}/dashboard"
           style="display: inline-block; padding: 10px 20px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View on Dashboard
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you forwarded a document to your Decision Intel analysis address.
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      log.error(`Confirmation email failed: ${res.status} ${err}`);
    }
  } catch (error) {
    log.error('Confirmation email error:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await req.text();

    // 2. Verify webhook signature
    if (!verifyWebhookSignature(req, rawBody)) {
      log.error('Webhook signature verification failed');
      return OK(); // Still return 200 to not leak info
    }

    // 3. Parse the inbound email payload
    let payload: InboundEmailPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      log.error('Failed to parse inbound email JSON');
      return OK();
    }

    const { from, to, subject, text, html, attachments } = payload;

    if (!to || typeof to !== 'string') {
      log.warn('Inbound email missing "to" field, skipping');
      return OK();
    }

    // 4. Extract token from the "to" address
    const token = extractTokenFromAddress(to);
    if (!token) {
      log.warn(`No valid token found in "to" address: ${to}`);
      return OK();
    }

    // 5. Look up user by token
    const userId = await resolveUserFromToken(token);
    if (!userId) {
      log.warn(`No user found for email token: ${token.substring(0, 4)}...`);
      return OK(); // Don't leak whether token exists
    }

    // 6. Rate limit check
    const rateLimitResult = await checkRateLimit(userId, '/api/email/inbound', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 emails per hour
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      log.warn(`Rate limit exceeded for email inbound, user: ${userId}`);
      return OK();
    }

    // 7. Resolve org membership for this user (if any)
    let userOrgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      userOrgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember table may not exist yet
    }

    const createdDocIds: string[] = [];

    // 8. Process attachments if present
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          const { filename, content: base64Content, contentType } = attachment;

          // Check if file type is supported
          if (!isFileTypeSupported(contentType, filename)) {
            log.info(`Skipping unsupported attachment: ${filename} (${contentType})`);
            continue;
          }

          // Convert base64 to Buffer
          const buffer = Buffer.from(base64Content, 'base64');

          // Enforce file size limit (5MB)
          const MAX_FILE_SIZE = 5 * 1024 * 1024;
          if (buffer.length > MAX_FILE_SIZE) {
            log.warn(`Attachment too large (${buffer.length} bytes), skipping: ${filename}`);
            continue;
          }

          // Extract text content
          const parsedContent = await parseFile(buffer, contentType, filename);
          if (!parsedContent.trim()) {
            log.warn(`Empty content extracted from attachment: ${filename}`);
            continue;
          }

          // Generate content hash for deduplication
          const contentHash = createHash('sha256').update(buffer).digest('hex');

          // Skip if identical content already analyzed for this user
          const existingDoc = await prisma.document.findFirst({
            where: { contentHash, userId },
            select: { id: true },
          });
          if (existingDoc) {
            log.info(
              `Duplicate content (hash: ${contentHash.slice(0, 8)}...), skipping: ${filename}`
            );
            continue;
          }

          // Encrypt if enabled
          const encryptedFields = isDocumentEncryptionEnabled()
            ? encryptDocumentContent(parsedContent)
            : {};

          // Create Document record
          const document = await prisma.document.create({
            data: {
              userId,
              orgId: userOrgId,
              filename,
              fileType: contentType,
              fileSize: buffer.length,
              content: parsedContent,
              ...encryptedFields,
              contentHash,
              status: 'pending',
            },
          });

          createdDocIds.push(document.id);
          log.info(`Created document ${document.id} from email attachment: ${filename}`);

          // Fire-and-forget: trigger analysis
          import('@/lib/analysis/analyzer')
            .then(({ analyzeDocument }) => analyzeDocument(document.id))
            .catch(err => log.error(`Analysis failed for document ${document.id}:`, err));
        } catch (err) {
          log.error(`Failed to process attachment ${attachment.filename}:`, err);
        }
      }
    }

    // 9. If no attachments were processed, use the email body as content
    if (createdDocIds.length === 0) {
      const bodyContent = text || html || '';
      if (!bodyContent.trim()) {
        log.warn('Email has no attachments and no body content');
        return OK();
      }

      const documentContent = subject ? `Subject: ${subject}\n\n${bodyContent}` : bodyContent;

      const contentHash = createHash('sha256').update(Buffer.from(documentContent)).digest('hex');

      const encryptedFields = isDocumentEncryptionEnabled()
        ? encryptDocumentContent(documentContent)
        : {};

      try {
        const document = await prisma.document.create({
          data: {
            userId,
            orgId: userOrgId,
            filename: subject ? `Email: ${subject.substring(0, 100)}` : 'Forwarded Email',
            fileType: 'text/plain',
            fileSize: Buffer.byteLength(documentContent),
            content: documentContent,
            ...encryptedFields,
            contentHash,
            status: 'pending',
          },
        });

        createdDocIds.push(document.id);
        log.info(`Created document ${document.id} from email body`);

        // Fire-and-forget: trigger analysis
        import('@/lib/analysis/analyzer')
          .then(({ analyzeDocument }) => analyzeDocument(document.id))
          .catch(err => log.error(`Analysis failed for document ${document.id}:`, err));
      } catch (err) {
        log.error('Failed to create document from email body:', err);
      }
    }

    // 10. Send confirmation email (fire-and-forget)
    if (createdDocIds.length > 0) {
      const senderEmail = typeof from === 'string' ? from : '';
      if (senderEmail) {
        sendConfirmationEmail(senderEmail, createdDocIds.length, subject || '').catch(err =>
          log.error('Failed to send confirmation email:', err)
        );
      }
    }

    log.info(
      `Processed inbound email: ${createdDocIds.length} document(s) created for user ${userId}`
    );

    // M5.1 — Passive outcome detection on the raw email body. Runs
    // AFTER document creation so the document channel catches attached
    // memos AND this email-specific channel catches short "FYI Project X
    // closed last week" updates that wouldn't hit the RAG similarity
    // threshold as standalone documents. Fire-and-forget; never blocks
    // the webhook response to Resend.
    const outcomeEmailBody = text || html || '';
    if (outcomeEmailBody.trim().length > 0) {
      import('@/lib/learning/outcome-inference')
        .then(({ detectOutcomeFromEmail }) =>
          detectOutcomeFromEmail(
            subject || '',
            outcomeEmailBody,
            typeof from === 'string' ? from : '',
            userId,
            userOrgId
          )
        )
        .then(drafts => {
          if (drafts.length > 0) {
            log.info(
              `Email outcome detection: ${drafts.length} draft outcome(s) created from inbound email`
            );
          }
        })
        .catch(err =>
          log.warn(
            'Email outcome detection failed (non-critical): ' +
              (err instanceof Error ? err.message : String(err))
          )
        );
    }

    return OK();
  } catch (error) {
    log.error('Unhandled error in email inbound webhook:', error);
    return OK(); // Always return 200
  }
}
