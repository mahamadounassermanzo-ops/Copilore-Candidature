import mammoth from "mammoth";

// IA gratuite : Google Gemini (clé gratuite créée sur aistudio.google.com)
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

export async function ask(prompt: string, o: { max?: number; json?: boolean; image?: { mime: string; data: string } } = {}) {
  const parts: Part[] = [{ text: prompt }];
  if (o.image) parts.unshift({ inline_data: { mime_type: o.image.mime, data: o.image.data } });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: o.max ?? 4000, ...(o.json ? { responseMimeType: "application/json" } : {}) },
    }),
  });
  if (r.status === 429) throw new Error("busy"); // quota gratuit atteint
  if (!r.ok) throw new Error(`gemini_${r.status} ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return ((d.candidates?.[0]?.content?.parts ?? []) as { text?: string }[]).map((p) => p.text ?? "").join("");
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
