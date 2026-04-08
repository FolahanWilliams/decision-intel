import { createClient } from '@/utils/supabase/server';
import { safeCompare } from '@/lib/utils/safe-compare';

const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY?.trim();

export interface AuthResult {
  userId?: string;
  error?: string;
  status?: number;
}

export async function authenticateApiRequest(request: Request): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  const apiKey = request.headers.get('x-extension-key');
  let effectiveUserId = userId;

  // Secure check: ensure EXTENSION_API_KEY is defined and not empty before comparing
  if (!effectiveUserId && EXTENSION_API_KEY && EXTENSION_API_KEY.length > 0) {
    if (!apiKey || !safeCompare(apiKey, EXTENSION_API_KEY)) {
      return { error: 'Unauthorized', status: 401 };
    }
    const extUserId = request.headers.get('x-extension-user-id');
    // Validate extension user ID format — alphanumeric, hyphens, underscores only, max 128 chars
    if (extUserId && !/^[a-zA-Z0-9_-]{1,128}$/.test(extUserId)) {
      return { error: 'Invalid extension user ID format', status: 400 };
    }
    if (!extUserId) {
      return { error: 'Extension user ID required (x-extension-user-id header)', status: 401 };
    }
    effectiveUserId = `ext_${extUserId}`;
  }

  if (!effectiveUserId) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { userId: effectiveUserId };
}
