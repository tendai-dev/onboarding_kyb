"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";

const system = createSystem(defaultConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <SessionProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SessionProvider>
    </ChakraProvider>
  );
}
