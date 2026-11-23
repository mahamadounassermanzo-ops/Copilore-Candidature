import mammoth from "mammoth";

// IA gratuite : Google Gemini. Si un modèle est surchargé (503) ou a atteint son quota (429),
// on essaie automatiquement le suivant.
const MODELS = Array.from(new Set([
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
]));

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

export async function ask(prompt: string, o: { max?: number; json?: boolean; image?: { mime: string; data: string } } = {}) {
  const parts: Part[] = [{ text: prompt }];
  if (o.image) parts.unshift({ inline_data: { mime_type: o.image.mime, data: o.image.data } });
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { maxOutputTokens: o.max ?? 4000, ...(o.json ? { responseMimeType: "application/json" } : {}) },
  });

  const start = Date.now();
  let last = "no_attempt";
  let all429 = true;
  for (const model of MODELS) {
    if (Date.now() - start > 38000) break; // Vercel coupe à 60 s
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
        body,
        signal: AbortSignal.timeout(18000),
      });
      if (r.ok) {
        const d = await r.json();
        const text = ((d.candidates?.[0]?.content?.parts ?? []) as { text?: string }[]).map((p) => p.text ?? "").join("");
        if (text.trim()) return text;
        all429 = false;
        last = `empty_response (${model})`;
        continue;
      }
      if (r.status !== 429) all429 = false;
      last = `gemini_${r.status} (${model}) ${(await r.text()).slice(0, 150)}`;
    } catch (e) {
      all429 = false;
      last = `fetch_failed (${model}) ${(e as Error).message}`;
    }
    console.error(last);
  }
  if (all429) throw new Error("busy"); // quota gratuit atteint sur tous les modèles
  throw new Error(last);
}

// Extrait le texte d'un CV ou d'une offre : PDF, Word, texte ou image (lue par l'IA)
export async function extractText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/"))
    return ask("Transcris fidèlement tout le texte de ce document. Réponds uniquement avec le texte, sans commentaire.",
      { image: { mime: file.type, data: buf.toString("base64") } });
  if (name.endsWith(".pdf")) return (await (await import("pdf-parse")).default(buf)).text;
  if (name.endsWith(".docx")) return (await mammoth.extractRawText({ buffer: buf })).value;
  return buf.toString("utf8");
}
