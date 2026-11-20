import { z } from "zod";
export const AnalysisSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  missingKeywords: z.array(z.string()).max(15),
  corrections: z.array(z.object({
    section: z.string(),
    before: z.string(),
    after: z.string(),
    reason: z.string(),
  })).max(5),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export type AnalysisWithCv = Analysis & { cv?: string };
