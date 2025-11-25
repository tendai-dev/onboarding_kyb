"use client";

import { Suspense } from "react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import { MukuruComponentProvider } from "@mukuru/mukuru-react-components";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SentryInit } from "./sentry-init";
import { SidebarProvider } from "../contexts/SidebarContext";
// Theme tokens available via import if needed
// import { theme } from "../lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <Suspense fallback={null}>
          <SentryInit />
        </Suspense>
        <ChakraProvider value={createSystem(defaultConfig)}>
          <MukuruComponentProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </MukuruComponentProvider>
        </ChakraProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
