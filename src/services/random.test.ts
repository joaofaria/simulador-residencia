import { describe, it, expect } from "vitest";
import { exams } from "../data/catalog";
import { areas, type Area } from "../types";
import {
  buildRandomExam,
  randomCounts,
  randomPool,
  splitByArea,
  questionNumber,
  questionOrigin,
} from "./random";
import { createAttempt } from "./session";
import { decodeStore } from "./storage";

// Gerador previsível para os testes.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}
const count = (ids: Area[]) =>
  Object.fromEntries(areas.map((a) => [a, ids.filter((x) => x === a).length]));

describe("Prova aleatória", () => {
  it("divide igualmente entre as áreas e espalha a sobra", () => {
    expect([...splitByArea(20, [...areas], seeded(1)).values()]).toEqual([
      4, 4, 4, 4, 4,
    ]);
    const split = splitByArea(10, ["clinica", "go", "pediatria"], seeded(2));
    expect([...split.values()].sort()).toEqual([3, 3, 4]);
  });

  it("sorteia só das áreas escolhidas, sem anuladas e sem repetir", () => {
    const exam = buildRandomExam(
      exams,
      { count: 30, areas: ["cirurgia", "preventiva"] },
      seeded(3),
      "x",
    );
    expect(exam.id).toBe("aleatoria-x");
    expect(exam.random).toBe(true);
    expect(exam.questions).toHaveLength(30);
    expect(new Set(exam.questions.map((q) => q.id)).size).toBe(30);
    expect(count(exam.questions.map((q) => q.area!))).toMatchObject({
      cirurgia: 15,
      preventiva: 15,
      clinica: 0,
    });
    for (const q of exam.questions) expect(q.key.status).toBe("verified");
    expect(new Set(exam.questions.map((q) => q.institution)).size).toBe(3);
  });

  it("nunca usa a demonstração e aguenta a maior quantidade em qualquer área", () => {
    const max = Math.max(...randomCounts);
    for (const area of areas) {
      expect(randomPool(exams, [area]).get(area)!.length).toBeGreaterThan(max);
      const exam = buildRandomExam(exams, { count: max, areas: [area] });
      expect(exam.questions.every((q) => !q.id.startsWith("demo"))).toBe(true);
    }
  });

  it("recusa configuração sem área ou com questões demais", () => {
    expect(() => buildRandomExam(exams, { count: 10, areas: [] })).toThrow();
    expect(() =>
      buildRandomExam(exams, { count: 500, areas: ["clinica"] }),
    ).toThrow();
  });

  it("numera pela ordem do sorteio e mostra a origem de cada questão", () => {
    const exam = buildRandomExam(exams, { count: 10, areas: ["go"] });
    expect(exam.questions.map((_, i) => questionNumber(exam, i))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    const q = exams[0].questions[0];
    expect(questionOrigin(q)).toBe("PSU-MG 2024 · questão 1 · Pediatria");
    expect(questionNumber(exams[0], 4)).toBe(5);
  });

  it("guarda as questões sorteadas no histórico", () => {
    const exam = buildRandomExam(exams, { count: 20, areas: [...areas] });
    const a = createAttempt(exam, 0, "r");
    const restored = decodeStore(
      JSON.stringify({ version: 2, attempts: [a] }),
    );
    expect(restored.attempts[0].exam.random).toBe(true);
    expect(restored.attempts[0].exam.questions.map((q) => q.id)).toEqual(
      exam.questions.map((q) => q.id),
    );
  });
});
