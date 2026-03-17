/**
 * Upload visualization images to Supabase Storage instead of
 * storing base64 data URIs in Postgres.
 *
 * Bucket: env SUPABASE_VISUALIZATION_BUCKET (default: "visualizations")
 * Path:   {entityType}/{entityId}/{name}.jpg
 */

import { createLogger } from '@/lib/utils/logger';

const log = createLogger('VisualizationStorage');

const BUCKET = process.env.SUPABASE_VISUALIZATION_BUCKET || 'visualizations';

/**
 * Upload a base64 data URI to Supabase Storage and return the public URL.
 * Returns null (never throws) when upload fails — callers treat this as
 * non-critical, same as the image generation itself.
 */
export async function uploadVisualization(
  dataUri: string,
  entityType: 'analysis' | 'audit',
  entityId: string,
  name: string
): Promise<string | null> {
  try {
    // Parse the data URI: "data:image/jpeg;base64,<bytes>"
    const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      log.warn('Invalid data URI format — skipping upload');
      return null;
    }

    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const storagePath = `${entityType}/${entityId}/${name}.jpg`;

    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType,
      upsert: true, // overwrite if re-analyzed
    });

    if (uploadError) {
      log.warn(`Visualization upload failed (${storagePath}): ${uploadError.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    log.warn(
      'Visualization upload error: ' + (error instanceof Error ? error.message : String(error))
    );
    return null;
  }
}

/**
 * Delete visualization files for a given entity (fire-and-forget).
 */
export async function deleteVisualizations(
  entityType: 'analysis' | 'audit',
  entityId: string
): Promise<void> {
  try {
    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();

    const paths = [
      `${entityType}/${entityId}/bias-web.jpg`,
      `${entityType}/${entityId}/pre-mortem.jpg`,
    ];

    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) {
      log.warn(`Visualization cleanup failed: ${error.message}`);
    }
  } catch (error) {
    log.warn(
      'Visualization cleanup error: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}
