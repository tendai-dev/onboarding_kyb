import "next-auth";

declare module "next-auth" {
  interface Session {
    // accessToken removed - tokens are stored server-side in Redis via NextAuth Account
    // sessionId removed - opaque session token in httpOnly cookie, managed by NextAuth adapter
    // This implements full BFF (Backend for Frontend) pattern with database strategy
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
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
  }
}

