import NextAuth from "next-auth";
import authConfig from "../auth.config";

const { auth } = NextAuth(authConfig());

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }

  if (req.auth && req.nextUrl.pathname === "/") {
    const newUrl = new URL("/mail/inbox", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
