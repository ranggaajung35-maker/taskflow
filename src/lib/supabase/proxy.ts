import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes Supabase Auth cookies before the App Router renders a request.
 * This is required because Server Components cannot persist refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow the public landing page to render during local setup without credentials.
  if (!supabaseUrl || !supabaseKey) return supabaseResponse;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update the request cookies so downstream Server Components see the
        // refreshed session during this same request.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Recreate the response with the updated request and persist cookies
        // back to the browser for the next request.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Verifies the JWT and refreshes it when it is close to expiring.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
