import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto both the request and the response so
          // subsequent Server Component reads see the refreshed session.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always call getUser() — never getSession() — in middleware.
  // getUser() validates the token with the Supabase auth server on every
  // request, preventing spoofed session cookies.
  // This call also triggers the automatic token refresh that keeps the
  // session alive between page loads.
  await supabase.auth.getUser();

  // No route gating — this middleware only refreshes the session cookie.
  // Personal Check and all other routes stay fully open.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match every route except:
     * - _next/static  (static bundle files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
