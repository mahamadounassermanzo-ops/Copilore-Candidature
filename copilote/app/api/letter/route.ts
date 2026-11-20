import { ask } from "@/lib/ai";
import { limited } from "@/lib/ratelimit";
export const runtime = "nodejs";
export const maxDuration = 60;

const STYLES: Record<string, string> = { formal: "formel et professionnel", warm: "chaleureux et motivé", direct: "direct et concis" };

export async function POST(req: Request) {
  if (limited(req)) return Response.json({ error: "rate_limited" }, { status: 429 });
  try {
    const { cv, job, style } = await req.json();
    if (typeof cv !== "string" || typeof job !== "string" || cv.length < 100 || job.length < 200)
      return Response.json({ error: "invalid_input" }, { status: 400 });
    const out = await ask(`Rédige une lettre de motivation à partir du CV et de l'offre.
Règles absolues :
- Utilise UNIQUEMENT des faits présents dans le CV. N'invente aucune expérience, aucun diplôme, aucun chiffre ni aucune compétence.
- Si le nom du candidat, l'entreprise ou le poste manquent, écris des crochets comme [Nom] ou [Entreprise].
- N'écris ni numéro de passeport, ni titre de séjour, ni autre numéro d'identité.
- Écris dans la langue de l'offre. Style : ${STYLES[style] ?? STYLES.formal}. Environ 250 à 300 mots en 4 paragraphes : accroche, parcours pertinent, apport pour l'entreprise, conclusion avec formule de politesse.
- Relie des points précis du CV aux exigences de l'offre.
- Réponds uniquement avec la lettre, sans commentaire.

<cv>
${cv.slice(0, 20000)}
</cv>
<offre>
${job.slice(0, 12000)}
</offre>`);
    return Response.json({ letter: out.trim() });
  } catch (e) {
    console.error(e);
    const busy = (e as Error).message === "busy";
    return Response.json({ error: "letter_failed" }, { status: busy ? 429 : 500 });
  }
}
