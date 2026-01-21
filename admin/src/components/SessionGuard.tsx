'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * SessionGuard component that checks session validity when:
 * 1. Page becomes visible (user returns via back button or tab switch)
 * 2. Page is restored from bfcache
 * 
 * This prevents the "death spiral" issue where logged-out users see cached pages
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Handle page visibility change (tab switch, back button with bfcache)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'unauthenticated') {
        // User is not authenticated, redirect to login
        window.location.replace('/?session_expired=1');
      }
    };

    // Handle pageshow event (specifically for bfcache restoration)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && status === 'unauthenticated') {
        // Page was restored from bfcache and user is not authenticated
        window.location.replace('/?session_expired=1');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [status, router, pathname]);

  // If unauthenticated on a protected route, redirect immediately
  // But check if we're already redirecting to avoid loops
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/') {
      // Check if we're already on the login page or if there's a logout parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isLogout = urlParams.get('_logout');
      const isSessionExpired = urlParams.get('session_expired');
      
      // Only redirect if we're not already handling logout/session expiry
      if (!isLogout && !isSessionExpired) {
        window.location.replace('/?session_expired=1');
      }
    }
  }, [status, pathname]);

  return <>{children}</>;
}
