// Limite simple par IP (en mémoire). En production sur Vercel, préférez Upstash Redis : la mémoire n'est pas partagée entre instances.
const hits = new Map<string, number[]>();
export function limited(req: Request, max = 15, windowMs = 3600_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now); hits.set(ip, recent);
  return recent.length > max;
}
