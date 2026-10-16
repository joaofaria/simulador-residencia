import { z } from "zod";
export const areas = [
  "clinica",
  "cirurgia",
  "go",
  "pediatria",
  "preventiva",
] as const;
export type Area = (typeof areas)[number];
export const areaLabels: Record<Area, string> = {
  clinica: "Clínica Médica",
  cirurgia: "Cirurgia",
  go: "Ginecologia e Obstetrícia",
  pediatria: "Pediatria",
  preventiva: "Medicina Preventiva",
};
export const areaShortLabels: Record<Area, string> = {
  clinica: "CM",
  cirurgia: "Cir",
  go: "GO",
  pediatria: "Ped",
  preventiva: "Prev",
};
export const questionSchema = z.object({
  id: z.string(),
  institution: z.string(),
  year: z.number().int(),
  number: z.number().int().positive(),
  statement: z.string().min(1),
  alternatives: z
    .array(
      z.object({
        letter: z.string().regex(/^[A-E]$/),
        text: z.string().min(1),
      }),
    )
    .min(2),
  key: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("verified"),
      answer: z.string(),
      source: z.string().min(1),
      basis: z
        .enum(["official", "user-validated-pdf", "third-party", "demo"])
        .optional(),
    }),
    z.object({
      status: z.literal("annulled"),
      source: z.string().min(1),
      basis: z
        .enum(["official", "user-validated-pdf", "third-party", "demo"])
        .optional(),
    }),
    z.object({ status: z.literal("pending") }),
  ]),
  originalPages: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string(),
        page: z.number().int().positive(),
      }),
    )
    .optional(),
  area: z.enum(areas).optional(),
  images: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
  // Tabelas da prova refeitas em texto, mostradas depois do enunciado.
  tables: z
    .array(
      z.object({
        header: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      }),
    )
    .optional(),
  source: z.object({
    pdf: z.string().optional(),
    pages: z.array(z.number().int().positive()).default([]),
    // Crédito à banca quando o caderno original não é publicado no site.
    credit: z.string().optional(),
  }),
  review: z.enum(["approved", "required"]),
  notes: z.string().optional(),
});
export const examSchema = z.object({
  id: z.string(),
  institution: z.string(),
  year: z.number(),
  title: z.string(),
  demo: z.boolean(),
  // Prova montada por sorteio com questões de várias provas reais.
  random: z.boolean().optional(),
  questions: z.array(questionSchema),
  pdf: z.string().optional(),
  draftCount: z.number().int().nonnegative().optional(),
  keySource: z
    .object({
      type: z.enum(["validated-pdf", "official-pdf", "third-party"]),
      pdf: z.string().optional(),
      page: z.number().int().positive().optional(),
    })
    .optional(),
});
export type Question = z.infer<typeof questionSchema>;
export type Exam = z.infer<typeof examSchema>;
export const resultSchema = z.object({
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  blank: z.number().int().nonnegative(),
  annulled: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  valid: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100).nullable(),
  averageMs: z.number().nonnegative(),
});
export type Result = z.infer<typeof resultSchema>;
export const attemptSchema = z
  .object({
    id: z.string(),
    exam: examSchema,
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime().optional(),
    status: z.enum(["paused", "running", "finished"]),
    current: z.number().int().nonnegative(),
    answers: z.record(z.string()),
    times: z.record(z.number().nonnegative()),
    totalMs: z.number().nonnegative(),
    anchor: z.number().nullable(),
    result: resultSchema.optional(),
  })
  .superRefine((a, ctx) => {
    if (a.exam.questions.length === 0 || a.current >= a.exam.questions.length)
      ctx.addIssue({ code: "custom", message: "Posição da sessão inválida" });
    const ids = new Set(a.exam.questions.map((q) => q.id));
    for (const [id, letter] of Object.entries(a.answers))
      if (
        !ids.has(id) ||
        !a.exam.questions
          .find((q) => q.id === id)
          ?.alternatives.some((o) => o.letter === letter)
      )
        ctx.addIssue({
          code: "custom",
          message: "Resposta persistida inválida",
        });
    for (const id of Object.keys(a.times))
      if (!ids.has(id))
        ctx.addIssue({
          code: "custom",
          message: "Tempo para questão inexistente",
        });
    if (
      Math.abs(
        Object.values(a.times).reduce((sum, t) => sum + t, 0) - a.totalMs,
      ) > 1
    )
      ctx.addIssue({ code: "custom", message: "Tempos inconsistentes" });
  });
export type Attempt = z.infer<typeof attemptSchema>;
export const storeSchema = z.object({
  version: z.literal(2),
  attempts: z.array(attemptSchema),
});
export type Store = z.infer<typeof storeSchema>;
export type Outcome =
  | "correct"
  | "incorrect"
  | "blank"
  | "annulled"
  | "pending";
