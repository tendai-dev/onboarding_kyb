"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Box, Spinner, Text, Button, VStack } from "@chakra-ui/react";
import { authConfig, REQUIRED_RESOURCE, REQUIRED_ROLE, ENFORCE_ROLE } from "@/config/auth";
import { startAuthorization, getCodeVerifierAndState, clearPkceState } from "@/lib/auth/pkce";
// Removed: backupTokens - tokens are now stored server-side in Redis

async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: authConfig.clientId,
    code,
    redirect_uri: authConfig.redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch(authConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Token exchange failed: ${res.status}`);
  }
  return res.json();
}

function hasRequiredRole(accessTokenPayload: any): boolean {
  try {
    // 1) Preferred: client role on the specified resource
    const ra = accessTokenPayload?.resource_access ?? {};
    const preferredRoles: string[] | undefined = ra?.[REQUIRED_RESOURCE]?.roles;
    if (Array.isArray(preferredRoles) && preferredRoles.includes(REQUIRED_ROLE)) {
      return true;
    }

    // 2) Fallback: role granted on any client resource (some setups map to a different client)
    const anyClientHas = Object.values(ra).some((v: any) => Array.isArray(v?.roles) && v.roles.includes(REQUIRED_ROLE));
    if (anyClientHas) return true;

    // 3) Fallback: realm role
    const realmRoles: string[] | undefined = accessTokenPayload?.realm_access?.roles;
    if (Array.isArray(realmRoles) && realmRoles.includes(REQUIRED_ROLE)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function decodeJwt(token: string): any | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"checking" | "exchanging" | "success" | "error">("checking");
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const run = async () => {
      setPhase("checking");
      const url = new URL(window.location.href);
      
      // Check for Keycloak error parameters first
      const errorParam = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");
      if (errorParam) {
        let errorMessage = "Authentication failed.";
        if (errorDescription) {
          errorMessage = decodeURIComponent(errorDescription);
        } else {
          // Map common Keycloak error codes to user-friendly messages
          const errorMessages: Record<string, string> = {
            "access_denied": "Access was denied. Please try again.",
            "invalid_request": "Invalid authentication request. Please try again.",
            "invalid_client": "Authentication configuration error. Please contact support.",
            "invalid_grant": "Authentication session expired. Please try again.",
            "unauthorized_client": "Client not authorized. Please contact support.",
            "unsupported_grant_type": "Authentication method not supported. Please contact support.",
            "invalid_scope": "Requested permissions are invalid. Please contact support.",
            "server_error": "Authentication server error. Please try again later.",
            "temporarily_unavailable": "Authentication service is temporarily unavailable. Please try again later.",
          };
          errorMessage = errorMessages[errorParam] || errorMessage;
        }
        setError(errorMessage);
        setPhase("error");
        return;
      }
      
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const { codeVerifier, state } = getCodeVerifierAndState();

      // If code is missing, user navigated directly to callback: start flow
      if (!code || !codeVerifier) {
        startAuthorization(authConfig);
        return;
      }
      
      // Validate state parameter (CSRF protection)
      if (state && returnedState && state !== returnedState) {
        setError("Security validation failed. Please try again.");
        setPhase("error");
        return;
      }
      
      // If no state was sent but one was returned, that's also suspicious
      if (!state && returnedState) {
        setError("Security validation failed. Please try again.");
        setPhase("error");
        return;
      }

      try {
        setPhase("exchanging");
        
        // Retry logic for network failures
        let tokens;
        let lastError: Error | null = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            tokens = await exchangeCodeForTokens(code, codeVerifier);
            break;
          } catch (e: any) {
            lastError = e;
            // Don't retry on client errors (4xx)
            if (e.message?.includes('400') || e.message?.includes('401') || 
                e.message?.includes('403') || e.message?.includes('404')) {
              throw e;
            }
            // Retry on network/server errors
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
            throw e;
          }
        }
        
        if (!tokens) {
          throw lastError || new Error("Failed to exchange authorization code");
        }
        
        const access = tokens.access_token as string;
        const refresh = tokens.refresh_token as string | undefined;
        
        // Validate access token format
        if (!access || typeof access !== 'string') {
          setError("Received invalid authentication token. Please try again.");
          setPhase("error");
          return;
        }
        
        const tokenParts = access.split('.');
        if (tokenParts.length !== 3) {
          setError("Received invalid authentication token format. Please try again.");
          setPhase("error");
          return;
        }
        
        const payload = decodeJwt(access);
        if (!payload) {
          setError("Failed to process authentication token. Please try again.");
          setPhase("error");
          return;
        }

        if (ENFORCE_ROLE && !hasRequiredRole(payload)) {
          setError("Your account lacks the required business-user role.");
          setPhase("error");
          return;
        }

        // SECURITY: Tokens are now stored server-side in Redis via NextAuth
        // DO NOT store tokens in localStorage - this is a security risk
        // This callback page handles legacy PKCE flow, but NextAuth handles OAuth callbacks at /api/auth/callback/keycloak
        // If we reach here, it means the user completed PKCE flow - redirect to NextAuth to complete properly
        
        clearPkceState();
        
        // Note: This callback page should ideally not be used anymore
        // NextAuth handles OAuth callbacks at /api/auth/callback/keycloak
        // If user reaches here, redirect to NextAuth sign-in
        console.log('[Auth Callback] Legacy PKCE flow - redirecting to NextAuth for proper token storage');
        
        setPhase("success");
        // Redirect to NextAuth sign-in which will handle token storage in Redis
        router.replace("/auth/login");
      } catch (e: any) {
        let errorMessage = "Authentication failed. Please try again.";
        
        // Try to parse JSON error response from Keycloak
        let errorData: any = null;
        try {
          if (e.message && typeof e.message === 'string') {
            errorData = JSON.parse(e.message);
          }
        } catch {
          // Not JSON, use string as-is
        }
        
        // Handle specific Keycloak error codes
        if (errorData?.error === 'invalid_grant') {
          errorMessage = errorData.error_description 
            ? decodeURIComponent(errorData.error_description)
            : "Your authentication session has expired. Please sign in again.";
          // Clear PKCE state and redirect to login
          clearPkceState();
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
          setError(errorMessage);
          setPhase("error");
          return;
        }
        
        // Provide more specific error messages
        if (e.message?.includes('NetworkError') || e.message?.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (e.message?.includes('401')) {
          errorMessage = "Authentication failed. Please sign in again.";
        } else if (e.message?.includes('400')) {
          // Parse JSON error if possible
          if (errorData?.error_description) {
            errorMessage = decodeURIComponent(errorData.error_description);
          } else if (errorData?.error === 'invalid_grant') {
            // Handle "code already used" scenario (common in React Strict Mode)
            errorMessage = "The authorization code has already been used. This may happen if the page reloaded. Please sign in again.";
            // Clear PKCE state and redirect to login
            clearPkceState();
            setTimeout(() => {
              router.replace('/');
            }, 2000);
          } else {
            errorMessage = "Invalid authentication request. The authorization code may have expired or already been used. Please try again.";
          }
        } else if (errorData?.error_description) {
          errorMessage = decodeURIComponent(errorData.error_description);
        } else if (e.message) {
          errorMessage = e.message;
        }
        
        // Don't log expected errors (like invalid_grant from expired codes)
        if (!errorData || errorData.error !== 'invalid_grant') {
          console.error('Authentication error:', e);
        }
        
        setError(errorMessage);
        setPhase("error");
      }
    };
    run();
  }, [router]);

  // Unified full-screen loader overlay for all non-error states
  if (phase !== "error") {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner />
          <Text>Completing sign-in…</Text>
        </VStack>
      </Box>
    );
  }

  // Error state
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4}>
        <Text color="red.500" fontWeight="bold">{error}</Text>
        <Button onClick={() => startAuthorization(authConfig)}>Back to sign in</Button>
      </VStack>
    </Box>
  );
}


