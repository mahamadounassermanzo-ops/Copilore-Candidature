"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const COLS = [["saved", "Sauvegardée"], ["applied", "Postulée"], ["followed_up", "Relancée"], ["interview", "Entretien"], ["offer", "Offre"], ["rejected", "Refus"]] as const;
type Card = { id: string; status: string; jobs: { title: string; company: string } | null };

export default function Kanban() {
  const [cards, setCards] = useState<Card[]>([]);
  const [title, setTitle] = useState(""); const [company, setCompany] = useState("");
  const [uid, setUid] = useState("");
  const load = async () => {
    const { data } = await supabase.from("applications").select("id,status,jobs(title,company)").order("created_at");
    setCards((data as any) ?? []);
  };
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setUid(data.session?.user.id ?? ""); if (data.session) load(); }); }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { data: job } = await supabase.from("jobs").insert({ user_id: uid, title, company, description: title }).select().single();
    if (job) await supabase.from("applications").insert({ user_id: uid, job_id: job.id });
    setTitle(""); setCompany(""); load();
  }
  const move = async (id: string, status: string) => {
    await supabase.from("applications").update({ status, applied_at: status === "applied" ? new Date().toISOString() : undefined }).eq("id", id);
    load();
  };
  if (!uid) return <main className="p-8">Connectez-vous depuis la page d’accueil. <a href="/" className="underline">Retour</a></main>;
  return (
    <main className="px-5 py-10">
      <h1 className="text-3xl font-bold">Suivi des candidatures</h1>
      <form onSubmit={add} className="mt-5 flex flex-wrap gap-2">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poste" className="rounded-md border border-line p-2 text-sm" />
        <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Entreprise" className="rounded-md border border-line p-2 text-sm" />
        <button className="rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white">Ajouter</button>
      </form>
      <div className="mt-8 grid gap-4 overflow-x-auto md:grid-cols-6">
        {COLS.map(([key, label]) => (
          <section key={key} className="min-w-40">
            <h2 className="mb-2 text-sm font-semibold">{label} ({cards.filter((c) => c.status === key).length})</h2>
            {cards.filter((c) => c.status === key).map((c) => (
              <article key={c.id} className="mb-2 rounded-md border border-line bg-white p-3 text-sm">
                <p className="font-medium">{c.jobs?.title}</p><p className="text-ink/60">{c.jobs?.company}</p>
                <select value={c.status} onChange={(e) => move(c.id, e.target.value)} aria-label="Changer de colonne" className="mt-2 w-full rounded border border-line text-xs">
                  {COLS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </article>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
