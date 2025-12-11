'use client';

import { SessionProvider } from 'next-auth/react';
import { MukuruComponentProvider } from '@mukuru/mukuru-react-components';
import { AuthProvider } from '@/contexts/AuthContext';
import EmotionRegistry from '@/lib/emotion-registry';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <SessionProvider>
        <MukuruComponentProvider
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </MukuruComponentProvider>
      </SessionProvider>
    </EmotionRegistry>
  );
}
