import { extractText } from "@/lib/ai";
import { limited } from "@/lib/ratelimit";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (limited(req)) return Response.json({ error: "rate_limited" }, { status: 429 });
  try {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return Response.json({ error: "no_file" }, { status: 400 });
    if (file.size > 4_000_000) return Response.json({ error: "file_too_large" }, { status: 413 });
    const text = (await extractText(file)).trim().slice(0, 20000);
    return Response.json({ text });
  } catch (e) {
    console.error(e);
    const busy = (e as Error).message === "busy";
    return Response.json({ error: "read_failed" }, { status: busy ? 429 : 500 });
  }
}
