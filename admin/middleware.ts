import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

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

