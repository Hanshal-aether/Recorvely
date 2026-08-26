export { default } from "next-auth/middleware";

// Only the dashboard needs a session. /login, /signup, and the API routes
// handle their own auth (or none, for the public signup/login endpoints).
export const config = {
  matcher: ["/dashboard/:path*"],
};
