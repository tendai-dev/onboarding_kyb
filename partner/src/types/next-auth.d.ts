import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // accessToken removed - tokens are stored server-side in Redis only
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    error?: string;
  }

  interface User {
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // accessToken and refreshToken removed from JWT - stored in Redis only
    sessionId?: string; // Used to look up tokens in Redis
    accessTokenExpiryTime?: number;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    roles?: string[]; // Roles from Keycloak token (resource:kyb-connect)
    error?: string;
  }
}

