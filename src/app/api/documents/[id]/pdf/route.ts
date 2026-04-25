import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { buildDocumentAccessWhere } from '@/lib/utils/document-access';

const log = createLogger('DocumentPdfRoute');

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    // RBAC (3.5): visibility-aware. Storage path uses the doc OWNER's
    // userId so teammates with read access can resolve the underlying
    // signed URL (the path was previously hardcoded to user.id which only
    // worked for owners — quietly broke team-shared PDFs).
    const access = await buildDocumentAccessWhere(id, user.id);
    const doc = await prisma.document.findFirst({
      where: access.where,
      select: { id: true, filename: true, fileType: true, userId: true },
    });

    if (!doc) {
      return apiError({ error: 'Document not found', status: 404 });
    }

    const isPdf =
      doc.fileType === 'application/pdf' || doc.filename?.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return apiError({ error: 'Document is not a PDF', status: 400 });
    }

    const ext = doc.filename ? '.' + doc.filename.split('.').pop() : '.pdf';
    const storagePath = `${doc.userId}/${doc.id}${ext}`;
    const bucket = process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf';

    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceClient = getServiceSupabase();

    const { data, error } = await serviceClient.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      log.error('Failed to create signed URL', { error, storagePath });
      return apiError({ error: 'Failed to retrieve PDF', status: 500 });
    }

    return apiSuccess({ data: { url: data.signedUrl } });
  } catch (err) {
    log.error('PDF route error', err);
    return apiError({ error: 'Internal server error', status: 500 });
  }
}
