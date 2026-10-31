import { createBrowserClient } from "@supabase/ssr";

/** Auth only. All data goes through the Express admin API (RLS blocks PostgREST). */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
