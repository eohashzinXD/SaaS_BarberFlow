import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth-config";
import { resolveAccess } from "@/server/auth/access";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const resolution = resolveAccess({
    pathname: request.nextUrl.pathname,
    hasSession: Boolean(request.auth?.user)
  });

  if (resolution === "login") {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(url);
  }

  if (resolution === "dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/login", "/register"]
};
