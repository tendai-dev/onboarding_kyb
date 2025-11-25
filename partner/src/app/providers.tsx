"use client";

import { Suspense } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import { MukuruComponentProvider } from "@mukuru/mukuru-react-components";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MukuruComponentProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MukuruComponentProvider>
    </SessionProvider>
  );
}
