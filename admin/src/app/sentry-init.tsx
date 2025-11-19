"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setUserContext, clearUserContext } from "@/lib/sentry-client";

/**
 * Component to initialize Sentry user context from NextAuth session
 * This should be included in the root layout
 */
export function SentryInit() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Set user context in Sentry
      setUserContext({
        id: session.user.id || session.user.email || undefined,
        email: session.user.email || undefined,
        username: session.user.name || session.user.email || undefined,
        name: session.user.name || undefined,
      });
    } else if (status === "unauthenticated") {
      // Clear user context on logout
      clearUserContext();
    }
  }, [session, status]);

  return null;
}

