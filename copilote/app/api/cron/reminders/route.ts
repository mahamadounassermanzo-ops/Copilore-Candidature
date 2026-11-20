import { adminClient } from "@/lib/server";

// À appeler chaque heure (Vercel Cron / Supabase cron) avec l'en-tête Authorization: Bearer CRON_SECRET
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("forbidden", { status: 403 });
  if (process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED !== "true") return Response.json({ sent: 0, disabled: true });
  const db = adminClient();
  const limit = new Date(Date.now() + 24 * 36e5).toISOString();
  const { data: passes } = await db.from("passes").select("*")
    .is("cancelled_at", null).eq("reminder_sent", false).lte("ends_at", limit).gt("ends_at", new Date().toISOString());
  let sent = 0;
  for (const p of passes ?? []) {
    const { data } = await db.auth.admin.getUserById(p.user_id);
    const to = data.user?.email; if (!to) continue;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM, to,
        subject: "Votre pass se termine demain",
        text: `Votre pass 7 jours se termine le ${new Date(p.ends_at).toLocaleString("fr-FR")}.\nAucun renouvellement automatique sans votre accord. Résiliation en un clic : ${process.env.APP_URL}/pass`,
      }),
    });
    if (r.ok) { await db.from("passes").update({ reminder_sent: true }).eq("id", p.id); sent++; }
  }
  return Response.json({ sent });
}
