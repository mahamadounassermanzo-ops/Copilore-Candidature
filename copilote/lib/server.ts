import { createClient } from "@supabase/supabase-js";
// Client agissant AU NOM de l'utilisateur (le RLS s'applique)
export function userClient(req: Request) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
  });
}
export const adminClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
