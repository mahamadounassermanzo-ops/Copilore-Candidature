import { ask } from "@/lib/ai";
import { AnalysisSchema } from "@/lib/schema";
import { limited } from "@/lib/ratelimit";
export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Tu es un conseiller en recrutement. Compare un CV à une offre.
Règles absolues :
- N'invente JAMAIS une expérience, un diplôme, un chiffre ou une compétence absents du CV. Une correction ne peut que reformuler, réordonner ou mettre en avant ce qui existe déjà.
- "before" est une citation exacte et courte (une phrase) copiée du CV ; "after" est la reformulation ; "reason" explique le lien avec l'offre.
- Réponds dans la langue du CV.
- Réponds UNIQUEMENT avec un objet JSON : {"score":0-100,"summary":"...","missingKeywords":["..."],"corrections":[{"section":"","before":"","after":"","reason":""}]} avec 5 corrections. Aucun texte autour.`;

export async function POST(req: Request) {
  if (limited(req)) return Response.json({ error: "rate_limited" }, { status: 429 });
  try {
    const { cv, job } = await req.json();
    if (typeof cv !== "string" || typeof job !== "string" || cv.length < 100 || job.length < 200)
      return Response.json({ error: "invalid_input" }, { status: 400 });
    const out = await ask(`${SYSTEM}\n\n<cv>\n${cv.slice(0, 20000)}\n</cv>\n<offre>\n${job.slice(0, 12000)}\n</offre>`, { json: true });
    const raw = out.replace(/```json|```/g, "").trim();
    const analysis = AnalysisSchema.parse(JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)));
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const cvN = norm(cv); // garde-fou anti-invention
    analysis.corrections = analysis.corrections.filter((c) => cvN.includes(norm(c.before)));
    return Response.json(analysis);
  } catch (e) {
    console.error(e);
    const busy = (e as Error).message === "busy";
    return Response.json({ error: "analysis_failed" }, { status: busy ? 429 : 500 });
  }
}
