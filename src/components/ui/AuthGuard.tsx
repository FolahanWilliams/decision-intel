'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * Listens for Supabase auth state changes on the client side.
 * Redirects to /login when the session expires or is signed out,
 * preventing users from getting stuck with 401 errors.
 */
export function AuthGuard() {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login?error=session_expired';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
