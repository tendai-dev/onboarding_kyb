'use client';

import { SessionProvider } from 'next-auth/react';
import { MukuruComponentProvider } from '@mukuru/mukuru-react-components';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SentryInit } from './sentry-init';
import { SidebarProvider } from '../contexts/SidebarContext';
import EmotionRegistry from '@/lib/emotion-registry';
import { useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client side before rendering providers
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a simple loading state until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--mukuru-background-light)',
          fontFamily: "'Madera', 'Helvetica Neue', 'Arial', sans-serif",
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--mukuru-grey-light)',
            borderTop: '4px solid var(--mukuru-buttons-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

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
              {children}
              {/* SentryInit doesn't need Suspense - it's just a side effect */}
              <SentryInit />
            </SidebarProvider>
          </ErrorBoundary>
        </MukuruComponentProvider>
      </SessionProvider>
    </EmotionRegistry>
  );
}
