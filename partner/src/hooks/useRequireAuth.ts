"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Only redirect if not already on an auth page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth/')) {
        router.push('/auth/login');
      }
    }
  }, [status, router]);

  return { 
    isAuthenticated: status === "authenticated" && !!session, 
    isLoading: status === "loading" 
  };
}

