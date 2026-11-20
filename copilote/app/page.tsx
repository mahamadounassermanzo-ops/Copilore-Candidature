"use client";
import { useState } from "react";
import { dict, Locale } from "@/lib/i18n";
import type { Analysis } from "@/lib/schema";

async function post(url: string, body: BodyInit, json = false) {
  const r = await fetch(url, { method: "POST", body, headers: json ? { "Content-Type": "application/json" } : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 429 ? "busy" : r.status === 413 ? "big" : "fail");
  return data;
}

export default function Home() {
  const [lang, setLang] = useState<Locale>("fr");
  const t = dict[lang];
  const [cv, setCv] = useState(""); const [cvStat, setCvStat] = useState("");
  const [job, setJob] = useState(""); const [jobStat, setJobStat] = useState("");
  const [res, setRes] = useState<Analysis | null>(null); const [acc, setAcc] = useState<boolean[]>([]);
  const [style, setStyle] = useState("formal"); const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(""); const [err, setErr] = useState("");

  const msg = (e: unknown) => ({ busy: t.errBusy, big: t.errBig }[(e as Error).message as "busy" | "big"] ?? t.errFail);

  async function readFile(f: File, set: (s: string) => void, stat: (s: string) => void) {
    setErr(""); stat(t.reading);
    if (f.size > 4_000_000) return stat("✗ " + t.errBig);
    try {
      const fd = new FormData(); fd.append("file", f);
      const { text } = await post("/api/read", fd);
      if (!text || text.length < 50) return stat("✗ " + f.name + " : " + t.errRead);
      set(text); stat(`✓ ${f.name} · ${text.length} ${t.chars}`);
    } catch (e) { stat("✗ " + f.name + " : " + msg(e)); }
  }

  async function run(kind: "analyze" | "letter") {
    setErr("");
    if (cv.length < 100 || job.length < 200) return setErr(t.errIn);
    setBusy(kind);
    try {
      if (kind === "analyze") {
        const d = await post("/api/analyze", JSON.stringify({ cv, job }), true);
        setRes(d); setAcc(d.corrections.map(() => true));
      } else {
        const d = await post("/api/letter", JSON.stringify({ cv, job, style }), true);
        setLetter(d.letter);
      }
    } catch (e) { setErr(msg(e)); }
    setBusy("");
  }

  const finalCv = () => {
    let out = cv;
    res?.corrections.forEach((c, i) => { if (acc[i] && out.includes(c.before)) out = out.replace(c.before, c.after); });
    return out;
  };
  const download = (name: string, text: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; a.click();
  };
  const btn = "rounded-md px-5 py-3 font-semibold disabled:opacity-60";

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 flex justify-end gap-2 text-sm">
        {(["fr", "en", "ar"] as Locale[]).map((l) => (
          <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
            className={`rounded-md px-3 py-1 ${lang === l ? "bg-ink text-white" : "border border-line"}`}>{l.toUpperCase()}</button>
        ))}
      </div>
      <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{t.title}</h1>
      <p className="mt-4 max-w-xl text-lg text-ink/70">{t.sub}</p>

      <section className="mt-8 grid gap-3">
        <label className="block text-sm font-medium">{t.cvfile}
          <input type="file" accept=".pdf,.docx,.txt,.md,image/*" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setCv, setCvStat)}
            className="mt-1 block w-full rounded-md border border-line bg-white p-3 text-sm" /></label>
        <p className="text-sm text-ink/60">{cvStat}</p>
        <label className="block text-sm font-medium">{t.job}
          <textarea value={job} onChange={(e) => setJob(e.target.value)} rows={8}
            className="mt-1 w-full rounded-md border border-line bg-white p-3 text-sm font-normal" /></label>
        <label className="block text-sm font-medium">{t.jobfile}
          <input type="file" accept=".pdf,.docx,.txt,.md,image/*" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setJob, setJobStat)}
            className="mt-1 block w-full rounded-md border border-line bg-white p-3 text-sm" /></label>
        <p className="text-sm text-ink/60">{jobStat}</p>
        <p className="rounded-md border border-line bg-white p-3 text-xs text-ink/70">{t.privacy}</p>

        <button onClick={() => run("analyze")} disabled={!!busy} className={`${btn} bg-pine text-white sm:w-fit`}>{busy === "analyze" ? t.loading : t.go}</button>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">{t.style}</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="rounded-md border border-line bg-white p-2 text-sm">
            <option value="formal">{t.s1}</option><option value="warm">{t.s2}</option><option value="direct">{t.s3}</option>
          </select>
          <button onClick={() => run("letter")} disabled={!!busy} className={`${btn} border border-line`}>{busy === "letter" ? t.loading : t.letterBtn}</button>
        </div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      </section>

      {letter && (
        <section className="mt-10">
          <h2 className="font-semibold">{t.letterTitle}</h2>
          <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={16} className="mt-2 w-full rounded-md border border-line bg-white p-3 text-sm" />
          <div className="mt-2 flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(letter)} className="rounded-md border border-line px-4 py-2 text-sm">{t.copy}</button>
            <button onClick={() => download("lettre-de-motivation.txt", letter)} className="rounded-md border border-line px-4 py-2 text-sm">{t.dl}</button>
          </div>
        </section>
      )}

      {res && (
        <section className="mt-12 border-t border-line pt-8">
          <div className="flex items-baseline gap-4"><span className="text-6xl font-bold text-pine">{res.score}</span><span className="text-lg">{t.score}</span></div>
          <p className="mt-3 text-ink/80">{res.summary}</p>
          <h2 className="mt-8 font-semibold">{t.missing}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{res.missingKeywords.map((k) => <li key={k} className="rounded-full bg-gold/20 px-3 py-1 text-sm">{k}</li>)}</ul>
          <h2 className="mt-8 font-semibold">{t.fixes}</h2>
          {!res.corrections.length && <p className="mt-2 text-sm">{t.none}</p>}
          <ol className="mt-3 grid gap-4">
            {res.corrections.map((c, i) => (
              <li key={i} className={`rounded-md border border-line bg-white p-4 text-sm ${acc[i] ? "" : "opacity-60"}`}>
                <p className="font-medium">{c.section}</p>
                <p className="mt-2 bg-red-50 p-2 line-through">{c.before}</p>
                <p className="mt-1 bg-green-50 p-2">{c.after}</p>
                <p className="mt-1 text-ink/60">{t.why} : {c.reason}</p>
                <div className="mt-3 flex gap-2">
                  {[true, false].map((v) => (
                    <button key={String(v)} onClick={() => setAcc(acc.map((a, j) => (j === i ? v : a)))} aria-pressed={acc[i] === v}
                      className={`rounded-md border px-3 py-1 ${acc[i] === v ? "border-pine bg-pine text-white" : "border-line"}`}>{v ? t.accept : t.refuse}</button>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <h2 className="mt-10 font-semibold">{t.finalCv}</h2>
          <pre id="print-area" className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-white p-5 text-sm">{finalCv()}</pre>
          <button onClick={() => window.print()} className={`${btn} mt-4 bg-pine text-white`}>{t.exportPdf}</button>
        </section>
      )}
    </main>
  );
}
