import { NextRequest, NextResponse } from "next/server";

// Auth protection is handled at the layout level via Refine authProvider
// Middleware only handles public routes passthrough
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
