/**
 * Design Partner contacts — single-contact operations.
 *
 * DELETE /api/founder-hub/design-partners/[id]/contacts/[contactId]
 *   Removes a contact. Cascade is implicit per the Prisma relation;
 *   this endpoint just deletes the PartnerContact row.
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('PartnerContactItem');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });
  const { id, contactId } = await params;

  try {
    // Confirm the contact belongs to the partner before deleting — so
    // a bad URL can't delete an unrelated contact by ID guess.
    const contact = await prisma.partnerContact.findFirst({
      where: { id: contactId, partnerAppId: id },
      select: { id: true },
    });
    if (!contact) return apiError({ error: 'Contact not found', status: 404 });

    await prisma.partnerContact.delete({ where: { id: contactId } });
    return apiSuccess({ data: { ok: true } });
  } catch (err) {
    log.error('Failed to delete contact:', err);
    return apiError({ error: 'Failed to delete contact', status: 500 });
  }
}
