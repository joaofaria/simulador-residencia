import { describe, it, expect } from "vitest";
import { exams } from "./catalog";
import {
  annulled,
  miniId,
  plan,
  questionId,
  themeQuestionIds,
  themes,
} from "./revisao-ipsemg";
import { buildThemeExam } from "../services/random";
import { createAttempt } from "../services/session";

const ipsemg = exams.filter((e) => e.institution === "IPSEMG");

describe("Revisão do IPSEMG", () => {
  it("põe cada questão das três provas em exatamente um tema", () => {
    const seen = new Map<string, string>();
    for (const [id, t] of Object.entries(themes))
      for (const [year, ns] of Object.entries(t.questions))
        for (const n of ns) {
          const q = questionId(Number(year), n);
          expect(seen.get(q), `${q} em ${id} e ${seen.get(q)}`).toBeUndefined();
          seen.set(q, id);
        }
    const all = ipsemg.flatMap((e) => e.questions.map((q) => q.id));
    expect(all).toHaveLength(300);
    expect([...seen.keys()].sort()).toEqual([...all].sort());
  });

  it("usa o tema da mesma área do bloco da questão", () => {
    const byId = new Map(
      ipsemg.flatMap((e) => e.questions).map((q) => [q.id, q]),
    );
    for (const t of Object.values(themes))
      for (const [year, ns] of Object.entries(t.questions))
        for (const n of ns)
          expect(byId.get(questionId(Number(year), n))!.area).toBe(t.area);
  });

  it("monta um mini simulado sem anuladas e dentro do limite", () => {
    const ids = themeQuestionIds(["cir-periop"], 3, false);
    const exam = buildThemeExam(
      exams,
      ids,
      { id: miniId(3, "manha"), title: "Dia 3", limit: 15 },
      () => 0.5,
      "x",
    );
    expect(exam.id).toBe("revisao-d3-manha-x");
    expect(exam.random).toBe(true);
    expect(exam.questions.length).toBe(15);
    expect(exam.questions.every((q) => q.key.status === "verified")).toBe(true);
    expect(() => createAttempt(exam, 0)).not.toThrow();
  });

  it("guarda as provas dos simulados completos que ainda vêm depois", () => {
    const ids = themeQuestionIds(["cir-periop"], 3, true);
    expect(ids.every((id) => id.startsWith("ipsemg-2024"))).toBe(true);
    const day6 = themeQuestionIds(["cm-pneumo"], 6, true);
    expect(day6.length).toBe(5);
  });

  it("lista as mesmas anuladas que o banco", () => {
    const fromBank = ipsemg.flatMap((e) =>
      e.questions.filter((q) => q.key.status === "annulled").map((q) => q.id),
    );
    const listed = Object.entries(annulled).flatMap(([y, ns]) =>
      ns.map((n) => questionId(Number(y), n)),
    );
    expect(listed.sort()).toEqual(fromBank.sort());
    expect(themeQuestionIds(["cir-trauma"], 9, false)).toHaveLength(9);
  });

  it("tem 9 dias com os três simulados completos", () => {
    expect(plan).toHaveLength(9);
    expect(
      plan.flatMap((d) => Object.values(d.slots)).flatMap((s) => s.full ?? []),
    ).toEqual([2024, 2025, 2026]);
  });
});
