import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { exams } from "./catalog";
import {
  createAttempt,
  navigate,
  answer,
  finish,
  score,
} from "../services/session";
import { decodeStore } from "../services/storage";
import { summaries, summarize } from "./summaries";
import { loadExam } from "./load";
const realExams = exams.filter((e) => !e.demo);

describe("Banco de provas reais e correção", () => {
  it("disponibiliza as seis provas e 450 questões com gabaritos aceitos", () => {
    expect(realExams.map((e) => e.id).sort()).toEqual([
      "psu-mg-2024",
      "psu-mg-2025",
      "psu-mg-2026",
      "santa-casa-bh-2024",
      "santa-casa-bh-2025",
      "santa-casa-bh-2026",
    ]);
    expect(realExams.reduce((sum, e) => sum + e.questions.length, 0)).toBe(450);
    expect(
      new Set(realExams.flatMap((e) => e.questions.map((q) => q.id))).size,
    ).toBe(450);
    for (const exam of realExams)
      for (const q of exam.questions) {
        expect(q.review).toBe("approved");
        expect(q.key.status).not.toBe("pending");
        if (q.key.status !== "pending")
          expect(q.key.basis).toBe("user-validated-pdf");
      }
  });
  it("preserva originais, imagens, tabelas e continuações com recortes existentes", () => {
    for (const exam of realExams)
      for (const q of exam.questions) {
        expect(q.originalPages?.length).toBeGreaterThan(0);
        expect(q.originalPages?.map((p) => p.page)).toEqual(q.source.pages);
        for (const original of q.originalPages ?? []) {
          expect(existsSync(`public/${original.src}`)).toBe(true);
          expect(original.src).toMatch(/[a-f0-9]{12}-q\d+-p\d+\.png$/);
          expect(
            readFileSync(`public/${original.src}`)
              .subarray(0, 8)
              .toString("hex"),
          ).toBe("89504e470d0a1a0a");
        }
      }
  });
  it("identifica anulações cujas células foram separadas na extração de texto", () => {
    const psu = realExams.find((e) => e.id === "psu-mg-2024")!;
    const santa = realExams.find((e) => e.id === "santa-casa-bh-2026")!;
    expect(
      psu.questions
        .filter((q) => q.key.status === "annulled")
        .map((q) => q.number),
    ).toEqual([18, 19, 34, 42]);
    expect(
      santa.questions
        .filter((q) => q.key.status === "annulled")
        .map((q) => q.number),
    ).toEqual([31, 32]);
  });
  it.each(realExams)(
    "corrige $id com 100% ao responder o gabarito do documento",
    (exam) => {
      let attempt = createAttempt(exam, 0, exam.id);
      for (const [i, q] of exam.questions.entries()) {
        attempt = navigate(attempt, i, i * 60000);
        if (q.key.status === "verified")
          attempt = answer(attempt, q.key.answer, i * 60000);
      }
      attempt = finish(attempt, exam.questions.length * 60000);
      const result = score(attempt);
      expect(result.percentage).toBe(100);
      expect(result.correct + result.annulled).toBe(exam.questions.length);
      expect(result.blank + result.incorrect + result.pending).toBe(0);
      expect(result.averageMs).toBe(60000);
      expect(Object.values(attempt.times).reduce((sum, t) => sum + t, 0)).toBe(
        attempt.totalMs,
      );
      const persisted = decodeStore(
        JSON.stringify({ version: 2, attempts: [attempt] }),
      ).attempts[0];
      expect(persisted.result).toEqual(result);
      expect(persisted.exam.questions[0].originalPages).toEqual(
        exam.questions[0].originalPages,
      );
    },
  );
  it.each(realExams)(
    "calcula brancos e anulações de $id sem produzir acertos",
    (exam) => {
      const result = score(finish(createAttempt(exam, 0, exam.id), 1000));
      expect(result.percentage).toBe(0);
      expect(result.correct + result.incorrect + result.pending).toBe(0);
      expect(result.blank + result.annulled).toBe(exam.questions.length);
    },
  );
  it("mantém o resumo da tela inicial igual ao conteúdo das provas", () => {
    expect(summaries).toEqual(exams.map(summarize));
  });
  it.each(exams)(
    "carrega $id sob demanda com o mesmo conteúdo",
    async (exam) => {
      expect(await loadExam(exam.id)).toEqual(exam);
    },
  );
});
