import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  const protectedRoutes = [
    "/owner",
    "/cashier",
    "/approver",
    "/auditor",
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) return NextResponse.next();

  // Read cookie (NOT localStorage — middleware runs on server)
  const branchUser = request.cookies.get("branchUser");

  if (!branchUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Apply only to dashboard routes
export const config = {
  matcher: ["/owner/:path*", "/cashier/:path*", "/approver/:path*", "/auditor/:path*"],
};
