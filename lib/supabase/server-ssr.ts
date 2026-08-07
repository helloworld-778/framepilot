import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client using @supabase/ssr.
 *
 * Reads and writes cookies from the Next.js request context so the session
 * the proxy refreshed is visible inside Server Components, Route Handlers, and
 * Server Actions.
 *
 * Uses NEXT_PUBLIC_SUPABASE_ANON_KEY — the key name Supabase generates by
 * default and the name present in .env.local.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot mutate cookies directly.
            // The proxy handles session refresh instead.
          }
        },
      },
    },
  );
}
