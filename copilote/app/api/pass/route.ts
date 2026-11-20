import { userClient } from "@/lib/server";

// GET : pass actif de l'utilisateur. POST {action:"start"|"cancel"}
export async function GET(req: Request) {
  if (process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED !== "true") return Response.json({ error: "disabled" }, { status: 403 });
  const db = userClient(req);
  const { data: u } = await db.auth.getUser();
  if (!u.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await db.from("passes").select("*").order("ends_at", { ascending: false }).limit(1);
  return Response.json(data?.[0] ?? null);
}

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED !== "true") return Response.json({ error: "disabled" }, { status: 403 });
  const db = userClient(req);
  const { data: u } = await db.auth.getUser();
  if (!u.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { action } = await req.json();

  if (action === "start") {
    // TODO paiement : créer ici la session Paddle / Lemon Squeezy / CMI et n'insérer le pass
    // qu'après confirmation du webhook de paiement. En attendant : pass d'essai gratuit.
    const ends = new Date(Date.now() + 7 * 864e5).toISOString();
    const { data, error } = await db.from("passes").insert({ user_id: u.user.id, ends_at: ends }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json(data);
  }
  if (action === "cancel") { // résiliation en un clic, sans question
    const { error } = await db.from("passes").update({ cancelled_at: new Date().toISOString() })
      .eq("user_id", u.user.id).is("cancelled_at", null);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }
  return Response.json({ error: "bad_action" }, { status: 400 });
}
