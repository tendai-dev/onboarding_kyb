import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // accessToken removed - tokens are stored server-side in Redis only
    // sessionId removed - stored in httpOnly JWT cookie only, never exposed to client-side JS
    // This implements full BFF (Backend for Frontend) pattern
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
    error?: string;
  }
}

