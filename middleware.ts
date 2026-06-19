import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@/lib/db/schema";

const ownerOnlyPrefixes = ["/settings", "/finance"];

const staffAllowedPrefixes = [
  "/",
  "/inventory",
  "/sales",
  "/appointments",
  "/login",
];

function pathAllowedForRole(pathname: string, role: UserRole): boolean {
  if (role === "owner") {
    return true;
  }

  if (role === "accountant") {
    return (
      pathname === "/" ||
      pathname.startsWith("/finance") ||
      pathname.startsWith("/bookkeeping")
    );
  }

  return staffAllowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (role) {
    if (
      role !== "owner" &&
      ownerOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))
    ) {
      return Response.redirect(new URL("/", req.nextUrl));
    }

    if (!pathAllowedForRole(pathname, role)) {
      return Response.redirect(new URL("/", req.nextUrl));
    }
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
