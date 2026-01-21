'use client';

import { SessionProvider } from 'next-auth/react';
import { MukuruComponentProvider } from '@mukuru/mukuru-react-components';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SentryInit } from './sentry-init';
import { SidebarProvider } from '../contexts/SidebarContext';
import { SessionGuard } from '../components/SessionGuard';
import EmotionRegistry from '@/lib/emotion-registry';
import { useEffect } from 'react';

/**
 * Root Providers Component
 *
 * Provider order is critical:
 * 1. EmotionRegistry - Handles CSS-in-JS for Emotion/Chakra UI
 * 2. SessionProvider - NextAuth session management
 * 3. MukuruComponentProvider - Includes ChakraProvider and theme setup
 * 4. ErrorBoundary - Catches errors (uses plain HTML/CSS, no Chakra UI)
 * 5. SidebarProvider - Sidebar state management
 *
 * All Chakra UI components MUST be rendered inside MukuruComponentProvider
 * which includes ChakraProvider internally.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Log when Providers component renders
  useEffect(() => {
    console.log('[Providers] Component mounted/rendered', {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });
  }, []);

  // Render immediately - removed mounted check to prevent blank page
  // Providers will handle client-side initialization internally
  return (
    <EmotionRegistry>
      <SessionProvider
        refetchInterval={5 * 60} // Refetch session every 5 minutes
        refetchOnWindowFocus={true}
        // Suppress console errors for connection failures
        // The SessionProvider will retry automatically
      >
        <MukuruComponentProvider
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <SidebarProvider>
              <SessionGuard>
                {children}
              </SessionGuard>
              {/* SentryInit doesn't need Suspense - it's just a side effect */}
              <SentryInit />
            </SidebarProvider>
          </ErrorBoundary>
        </MukuruComponentProvider>
      </SessionProvider>
    </EmotionRegistry>
  );
}
