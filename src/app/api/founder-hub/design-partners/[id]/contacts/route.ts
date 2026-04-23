/**
 * Design Partner contacts — list + create.
 *
 * GET  /api/founder-hub/design-partners/[id]/contacts
 *   Returns all contacts for a partner, ordered by createdAt desc.
 *
 * POST /api/founder-hub/design-partners/[id]/contacts
 *   Creates a contact. Body: { name, role, linkedInUrl?, linkedInInfo,
 *     meetingContext?, founderAsk? }
 *
 * Auth: x-founder-pass header.
 *
 * Partner-scoped so the Design Partners detail view can surface
 * "people at Sankore" with their individual meeting-prep plans. Each
 * contact's plan is generated on demand via the sibling
 *   POST .../contacts/[contactId]/generate-prep
 * endpoint and persisted on the row so re-reads don't re-spend Gemini
 * tokens.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('PartnerContacts');

const MIN_LINKEDIN_INFO = 40;

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });
  const { id } = await params;

  try {
    const partner = await prisma.designPartnerApplication.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!partner) return apiError({ error: 'Partner not found', status: 404 });

    const contacts = await prisma.partnerContact.findMany({
      where: { partnerAppId: id },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ data: { contacts } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      // Schema drift during migration deploy — return empty list so the
      // UI renders an empty state instead of an error toast.
      return apiSuccess({ data: { contacts: [] } });
    }
    log.error('Failed to list contacts:', err);
    return apiError({ error: 'Failed to load contacts', status: 500 });
  }
}

interface CreateBody {
  name?: string;
  role?: string;
  linkedInUrl?: string;
  linkedInInfo?: string;
  meetingContext?: string;
  founderAsk?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });
  const { id } = await params;

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  const name = (body.name ?? '').trim();
  const role = (body.role ?? '').trim();
  const linkedInInfo = (body.linkedInInfo ?? '').trim();

  if (!name) return apiError({ error: 'name is required', status: 400 });
  if (!role) return apiError({ error: 'role is required', status: 400 });
  if (linkedInInfo.length < MIN_LINKEDIN_INFO) {
    return apiError({
      error: `Paste at least ${MIN_LINKEDIN_INFO} characters of LinkedIn info so the prep generator has something to ground the plan in.`,
      status: 400,
    });
  }

  try {
    const partner = await prisma.designPartnerApplication.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!partner) return apiError({ error: 'Partner not found', status: 404 });

    const contact = await prisma.partnerContact.create({
      data: {
        partnerAppId: id,
        name,
        role,
        linkedInUrl: body.linkedInUrl?.trim() || null,
        linkedInInfo,
        meetingContext: body.meetingContext?.trim() || null,
        founderAsk: body.founderAsk?.trim() || null,
      },
    });

    return apiSuccess({ data: { contact } });
  } catch (err) {
    log.error('Failed to create contact:', err);
    return apiError({ error: 'Failed to create contact', status: 500 });
  }
}
