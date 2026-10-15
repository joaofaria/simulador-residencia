import {
  areas,
  type Area,
  type Attempt,
  type Exam,
  type Question,
  type Outcome,
} from "../types";
export function createAttempt(
  exam: Exam,
  now: number,
  id: string = crypto.randomUUID(),
): Attempt {
  if (!exam.questions.length)
    throw new Error("Prova sem questões disponíveis.");
  if (exam.questions.some((q) => q.review !== "approved"))
    throw new Error("Esta prova contém transcrições pendentes de revisão.");
  return {
    id,
    exam: structuredClone(exam),
    startedAt: new Date(now).toISOString(),
    status: "running",
    current: 0,
    answers: {},
    times: {},
    totalMs: 0,
    anchor: now,
  };
}
export function settle(a: Attempt, now: number): Attempt {
  if (a.status !== "running" || a.anchor === null) return a;
  const delta = Math.max(0, now - a.anchor);
  const q = a.exam.questions[a.current];
  return {
    ...a,
    totalMs: a.totalMs + delta,
    times: { ...a.times, [q.id]: (a.times[q.id] ?? 0) + delta },
    anchor: Math.max(a.anchor, now),
  };
}
export function pause(a: Attempt, now: number): Attempt {
  return {
    ...settle(a, now),
    status: a.status === "finished" ? "finished" : "paused",
    anchor: null,
  };
}
export function resume(a: Attempt, now: number): Attempt {
  return a.status !== "paused" ? a : { ...a, status: "running", anchor: now };
}
export function navigate(a: Attempt, index: number, now: number): Attempt {
  if (a.status === "finished" || index < 0 || index >= a.exam.questions.length)
    return a;
  return { ...settle(a, now), current: index };
}
export function answer(
  a: Attempt,
  letter: string | undefined,
  now: number,
): Attempt {
  if (a.status === "finished") return a;
  const next = settle(a, now);
  const id = a.exam.questions[a.current].id;
  const answers = { ...next.answers };
  if (letter === undefined) delete answers[id];
  else if (
    a.exam.questions[a.current].alternatives.some((o) => o.letter === letter)
  )
    answers[id] = letter;
  return { ...next, answers };
}
export function finish(a: Attempt, now: number): Attempt {
  if (a.status === "finished") return a;
  const completed: Attempt = {
    ...pause(a, now),
    status: "finished",
    finishedAt: new Date(now).toISOString(),
  };
  return { ...completed, result: score(completed) };
}
export function outcome(q: Question, selected?: string): Outcome {
  if (q.key.status === "annulled") return "annulled";
  if (q.key.status === "pending") return "pending";
  if (!selected) return "blank";
  return selected === q.key.answer ? "correct" : "incorrect";
}
export function score(a: Attempt) {
  if (a.status === "finished" && a.result) return a.result;
  const counts = {
    correct: 0,
    incorrect: 0,
    blank: 0,
    annulled: 0,
    pending: 0,
  };
  a.exam.questions.forEach((q) => counts[outcome(q, a.answers[q.id])]++);
  const valid = counts.correct + counts.incorrect + counts.blank;
  return {
    ...counts,
    total: a.exam.questions.length,
    valid,
    percentage: valid ? (100 * counts.correct) / valid : null,
    averageMs: a.exam.questions.length
      ? a.totalMs / a.exam.questions.length
      : 0,
  };
}
// Mensagem do resultado por faixa de aproveitamento.
export function scoreMessage(percentage: number | null) {
  if (percentage === null) return null;
  if (percentage >= 85) return "Toooop! Mandou muito bem.";
  if (percentage >= 70) return "Médio. Tá no caminho, falta pouco pro topo.";
  return "Se esforce mais! Revise os erros e tente de novo.";
}
export type AreaScore = {
  area: Area;
  correct: number;
  valid: number;
  percentage: number;
};
// Acertos por grande área, com a mesma regra do aproveitamento geral:
// anuladas e pendentes ficam de fora e válidas em branco contam como erro.
// Tentativas antigas guardam a prova sem área; `lookup` supre essa lacuna.
export function scoreByArea(
  attempts: Attempt[],
  lookup: Record<string, Area> = {},
): AreaScore[] {
  const totals = new Map<Area, { correct: number; valid: number }>();
  for (const a of attempts)
    for (const q of a.exam.questions) {
      const area = q.area ?? lookup[q.id];
      const result = outcome(q, a.answers[q.id]);
      if (!area || result === "annulled" || result === "pending") continue;
      const t = totals.get(area) ?? { correct: 0, valid: 0 };
      t.valid++;
      if (result === "correct") t.correct++;
      totals.set(area, t);
    }
  return areas
    .filter((area) => totals.has(area))
    .map((area) => {
      const { correct, valid } = totals.get(area)!;
      return { area, correct, valid, percentage: (100 * correct) / valid };
    });
}
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
