"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SentryInit } from "./sentry-init";

const system = createSystem(defaultConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <SentryInit />
        <ChakraProvider value={system}>
          {children}
        </ChakraProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
