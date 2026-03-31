import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If a redirect param was provided (e.g., from invite flow), use it
      // Validate: must start with "/" but NOT "//" (prevents protocol-relative open redirects)
      if (redirect && /^\/[^/]/.test(redirect)) {
        // Additional safety: parse and reconstruct to strip any encoded tricks
        const safeUrl = new URL(redirect, origin);
        if (safeUrl.origin === origin) {
          return NextResponse.redirect(safeUrl.toString());
        }
      }

      // Detect first-time users for onboarding
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const settings = await prisma.userSettings
            .findUnique({
              where: { userId: user.id },
              select: { onboardingCompleted: true },
            })
            .catch(() => null);

          if (!settings) {
            // First-time user — create settings and show welcome modal
            // Use upsert to safely handle concurrent login requests
            await prisma.userSettings.upsert({
              where: { userId: user.id },
              create: { userId: user.id },
              update: {},
            });
            return NextResponse.redirect(`${origin}/dashboard?welcome=true`);
          }

          if (!settings.onboardingCompleted) {
            return NextResponse.redirect(`${origin}/dashboard?welcome=true`);
          }
        }
      } catch {
        // Don't break login if onboarding detection fails
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=true`);
}
