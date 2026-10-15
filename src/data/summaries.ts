import type { Exam } from "../types";
import { demo } from "./demo";
// Resumo leve das provas para a tela inicial. As questões completas ficam nos
// JSON e só são baixadas ao iniciar o simulado (ver load.ts). O teste em
// catalog.test.ts garante que este resumo continua igual ao conteúdo dos JSON.
export type ExamSummary = Pick<
  Exam,
  "id" | "institution" | "year" | "title" | "demo" | "pdf" | "draftCount"
> & { available: number; keySource?: "validated-pdf" | "official-pdf" };
export function summarize(exam: Exam): ExamSummary {
  return {
    id: exam.id,
    institution: exam.institution,
    year: exam.year,
    title: exam.title,
    demo: exam.demo,
    pdf: exam.pdf,
    draftCount: exam.draftCount,
    keySource: exam.keySource?.type,
    available: exam.questions.every((q) => q.review === "approved")
      ? exam.questions.length
      : 0,
  };
}
const real = (
  institution: string,
  slug: string,
  year: number,
  available = 75,
  keySource: ExamSummary["keySource"] = "validated-pdf",
): ExamSummary => ({
  id: `${slug}-${year}`,
  institution,
  year,
  title: `${institution} • ${year}`,
  demo: false,
  pdf: `provas/${slug}-${year}.pdf`,
  draftCount: undefined,
  keySource,
  available,
});
export const summaries: ExamSummary[] = [
  real("PSU-MG", "psu-mg", 2024),
  real("Santa Casa BH", "santa-casa-bh", 2024),
  real("IPSEMG", "ipsemg", 2024, 100, "official-pdf"),
  real("PSU-MG", "psu-mg", 2025),
  real("Santa Casa BH", "santa-casa-bh", 2025),
  real("IPSEMG", "ipsemg", 2025, 100, "official-pdf"),
  real("PSU-MG", "psu-mg", 2026),
  real("Santa Casa BH", "santa-casa-bh", 2026),
  real("IPSEMG", "ipsemg", 2026, 100, "official-pdf"),
  summarize(demo),
];
