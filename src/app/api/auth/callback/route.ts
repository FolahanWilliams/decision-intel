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
      if (redirect && redirect.startsWith('/')) {
        return NextResponse.redirect(`${origin}${redirect}`);
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
            await prisma.userSettings
              .create({
                data: { userId: user.id },
              })
              .catch(() => {}); // Ignore if already exists (race condition)
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
