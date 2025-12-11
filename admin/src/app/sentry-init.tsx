'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Component to initialize Sentry user context from NextAuth session
 * This should be included in the root layout
 */
export function SentryInit() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Dynamically import to avoid issues if Sentry isn't initialized
    import('@/lib/sentry-client')
      .then(({ setUserContext, clearUserContext }) => {
        if (status === 'authenticated' && session?.user) {
          // Set user context in Sentry
          setUserContext({
            id: session.user.id || session.user.email || undefined,
            email: session.user.email || undefined,
            username: session.user.name || session.user.email || undefined,
            name: session.user.name || undefined,
          });
        } else if (status === 'unauthenticated') {
          // Clear user context on logout
          clearUserContext();
        }
      })
      .catch((error) => {
        // Silently fail if Sentry isn't available
        if (process.env.NODE_ENV === 'development') {
          console.debug('[SentryInit] Sentry not available:', error);
        }
      });
  }, [session, status]);

  return null;
}
