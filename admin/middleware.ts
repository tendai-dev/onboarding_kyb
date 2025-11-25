import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the session token from cookies
  const sessionToken = request.cookies.get("next-auth.session-token") || 
                       request.cookies.get("__Secure-next-auth.session-token");

  // If no session token, redirect to login
  if (!sessionToken) {
    const signInUrl = new URL("/", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Add any additional middleware logic here
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/applications/:path*",
    "/requirements/:path*",
    "/entity-types/:path*",
    "/audit-log/:path*",
    "/approvals/:path*",
    "/checklists/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/risk-review/:path*",
    "/work-queue/:path*",
    "/data-migration/:path*",
    "/refreshes/:path*",
  ],
};

