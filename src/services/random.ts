import { areas, areaLabels, type Area, type Exam, type Question } from "../types";

export const randomCounts = [10, 20, 30, 50, 75];

export type RandomConfig = { count: number; areas: Area[] };

// Questões que podem entrar no sorteio: aprovadas, com área e com gabarito
// verificado. Anuladas e pendentes ficam de fora porque não contam na nota.
export function randomPool(exams: Exam[], chosen: Area[]) {
  const pool = new Map<Area, Question[]>(chosen.map((a) => [a, []]));
  for (const exam of exams) {
    if (exam.demo || exam.random) continue;
    for (const q of exam.questions)
      if (
        q.area &&
        pool.has(q.area) &&
        q.review === "approved" &&
        q.key.status === "verified"
      )
        pool.get(q.area)!.push(q);
  }
  return pool;
}

function shuffle<T>(items: T[], rng: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Divide a quantidade igualmente entre as áreas escolhidas. A sobra da
// divisão vai para áreas sorteadas, uma questão para cada.
export function splitByArea(
  count: number,
  chosen: Area[],
  rng: () => number,
): Map<Area, number> {
  const base = Math.floor(count / chosen.length);
  const extra = new Set(shuffle(chosen, rng).slice(0, count % chosen.length));
  return new Map(chosen.map((a) => [a, base + (extra.has(a) ? 1 : 0)]));
}

export function buildRandomExam(
  exams: Exam[],
  config: RandomConfig,
  rng: () => number = Math.random,
  id: string = crypto.randomUUID(),
): Exam {
  const chosen = areas.filter((a) => config.areas.includes(a));
  if (!chosen.length) throw new Error("Escolha pelo menos uma área.");
  if (config.count < 1) throw new Error("Escolha quantas questões quer.");
  const pool = randomPool(exams, chosen);
  const picked: Question[] = [];
  for (const [area, n] of splitByArea(config.count, chosen, rng)) {
    const options = pool.get(area)!;
    if (options.length < n)
      throw new Error("Não há questões suficientes nas áreas escolhidas.");
    picked.push(...shuffle(options, rng).slice(0, n));
  }
  const now = new Date();
  return {
    id: `aleatoria-${id}`,
    institution: "Prova aleatória",
    year: now.getFullYear(),
    title: `Prova aleatória · ${picked.length} questões`,
    demo: false,
    random: true,
    questions: structuredClone(shuffle(picked, rng)),
  };
}

// Na prova aleatória a numeração segue a ordem do sorteio; a original aparece
// junto da prova de onde a questão veio.
export function questionNumber(exam: Exam, index: number) {
  return exam.random ? index + 1 : exam.questions[index].number;
}

export function questionOrigin(q: Question) {
  const origin = `${q.institution} ${q.year} · questão ${q.number}`;
  return q.area ? `${origin} · ${areaLabels[q.area]}` : origin;
}
