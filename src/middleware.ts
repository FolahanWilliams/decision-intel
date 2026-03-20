import { updateSession } from '@/utils/supabase/middleware';
import { NextRequest } from 'next/server';
import { validateOrigin, createCSRFErrorResponse } from '@/lib/utils/csrf';

export async function middleware(request: NextRequest) {
  // CSRF protection - validate origin for mutation requests
  if (!validateOrigin(request)) {
    return createCSRFErrorResponse();
  }

  // Continue with session update
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
