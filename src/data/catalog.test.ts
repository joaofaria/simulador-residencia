import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
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
  it("disponibiliza as nove provas e 750 questões com gabarito e fonte registrados", () => {
    expect(realExams.map((e) => e.id).sort()).toEqual([
      "ipsemg-2024",
      "ipsemg-2025",
      "ipsemg-2026",
      "psu-mg-2024",
      "psu-mg-2025",
      "psu-mg-2026",
      "santa-casa-bh-2024",
      "santa-casa-bh-2025",
      "santa-casa-bh-2026",
    ]);
    expect(realExams.reduce((sum, e) => sum + e.questions.length, 0)).toBe(750);
    expect(
      new Set(realExams.flatMap((e) => e.questions.map((q) => q.id))).size,
    ).toBe(750);
    for (const exam of realExams)
      for (const q of exam.questions) {
        expect(q.review).toBe("approved");
        expect(q.key.status).not.toBe("pending");
        if (q.key.status !== "pending")
          expect(q.key.basis).toBe(
            exam.keySource?.type === "official-pdf" ||
              (q.key.status === "annulled" && exam.id === "psu-mg-2026")
              ? "official"
              : "third-party",
          );
      }
  });
  it("não publica PDFs nem recortes de página; toda questão traz crédito à banca", () => {
    for (const exam of realExams)
      for (const q of exam.questions) {
        expect(q.source.pdf).toBeUndefined();
        expect(q.source.credit).toMatch(/AREMG|IBGP|ACCESS/);
        expect(q.statement).not.toMatch(/-\n/);
        for (const image of q.images) {
          expect(image.src).toMatch(/^provas\/figuras\//);
          expect(existsSync(`public/${image.src}`)).toBe(true);
        }
      }
    const withFigure = realExams.flatMap((e) =>
      e.questions.filter((q) => q.images.length || q.tables?.length),
    );
    expect(withFigure).toHaveLength(22);
  });
  it("limpa de tentativas antigas os recortes e PDFs retirados do site", () => {
    const exam = realExams.find((e) => e.id === "psu-mg-2024")!;
    const old = {
      ...exam,
      pdf: "provas/psu-mg-2024.pdf",
      questions: exam.questions.map((q) => ({
        ...q,
        images: [],
        source: { pdf: "provas/psu-mg-2024.pdf", pages: [3] },
        originalPages: [
          {
            src: "provas/assets/psu-mg-2024/abc-q001-p03.png",
            alt: "x",
            page: 3,
          },
        ],
      })),
    };
    const attempt = finish(createAttempt(old, 0, "antiga"), 1000);
    const restored = decodeStore(
      JSON.stringify({ version: 2, attempts: [attempt] }),
    ).attempts[0];
    expect(restored.exam.pdf).toBeUndefined();
    const q46 = restored.exam.questions.find((q) => q.number === 46)!;
    expect(Object.keys(q46)).not.toContain("originalPages");
    expect(q46.source.pdf).toBeUndefined();
    expect(q46.images).toEqual(exam.questions[45].images);
    expect(restored.result).toEqual(attempt.result);
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
  it("segue os gabaritos definitivos do IPSEMG e os blocos de 20 por área", () => {
    const annulled = Object.fromEntries(
      realExams
        .filter((e) => e.institution === "IPSEMG")
        .map((e) => [
          e.year,
          e.questions
            .filter((q) => q.key.status === "annulled")
            .map((q) => q.number),
        ]),
    );
    expect(annulled).toEqual({
      2024: [10, 24, 74, 79, 100],
      2025: [18, 20, 30, 42, 50],
      2026: [1, 6, 11, 39, 40, 72, 77, 80],
    });
    const order = ["cirurgia", "clinica", "go", "preventiva", "pediatria"];
    for (const exam of realExams.filter((e) => e.institution === "IPSEMG")) {
      expect(exam.questions).toHaveLength(100);
      for (const q of exam.questions)
        expect(q.area).toBe(order[Math.floor((q.number - 1) / 20)]);
    }
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
      expect(persisted.exam.questions[0].images).toEqual(
        exam.questions[0].images,
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
