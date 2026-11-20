"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function PassInner() {
  const [pass, setPass] = useState<any>(null);
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const call = useCallback(async (tk: string, method = "GET", body?: object) => {
    const r = await fetch("/api/pass", { method, headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
    return r.ok ? r.json() : null;
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const tk = data.session?.access_token ?? ""; setToken(tk);
      if (tk) setPass(await call(tk)); else setMsg("Connectez-vous depuis la page d’accueil pour gérer votre pass.");
    });
  }, [call]);
  const active = pass && !pass.cancelled_at && new Date(pass.ends_at) > new Date();
  const act = async (action: string) => { await call(token, "POST", { action }); setPass(await call(token)); };
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-bold">Pass 7 jours</h1>
      <p className="mt-3 text-ink/70">Pas de renouvellement automatique. Un e-mail vous prévient 24 h avant la fin. Résiliation immédiate d’un clic.</p>
      {msg && <p className="mt-6">{msg}</p>}
      {token && (active ? (
        <div className="mt-8 rounded-md border border-line bg-white p-5">
          <p>Pass actif jusqu’au <b>{new Date(pass.ends_at).toLocaleString("fr-FR")}</b>.</p>
          <button onClick={() => act("cancel")} className="mt-4 rounded-md bg-ink px-5 py-2 font-semibold text-white">Résilier maintenant</button>
        </div>
      ) : (
        <button onClick={() => act("start")} className="mt-8 rounded-md bg-pine px-5 py-3 font-semibold text-white">Activer le pass 7 jours</button>
      ))}
      <p className="mt-6"><a href="/" className="underline">Retour</a></p>
    </main>
  );
}

export default function Pass() {
  if (process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED !== "true")
    return <main className="mx-auto max-w-xl px-5 py-12"><p>Cette fonction est désactivée pour le moment.</p><p className="mt-4"><a href="/" className="underline">Retour</a></p></main>;
  return <PassInner />;
}
