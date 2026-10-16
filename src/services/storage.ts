import { storeSchema, attemptSchema, type Store, type Attempt } from "../types";
import type { Question } from "../types";
import figuras from "../data/figuras.json";
export const STORAGE_KEY = "residencia.store";
// PSU-MG e Santa Casa BH deixaram de publicar recortes e PDFs de terceiros.
// Tentativas antigas guardam uma cópia da prova com esses caminhos; aqui eles
// saem e entram as figuras e tabelas refeitas, para a revisão não quebrar.
const removed = /^provas\/(assets\/)?(psu-mg|santa-casa-bh)-\d{4}/;
const extras = figuras as Record<
  string,
  Partial<Pick<Question, "images" | "tables">>
>;
function withoutRemoved(q: Question): Question {
  if (
    !removed.test(q.source.pdf ?? "") &&
    !q.originalPages?.some((p) => removed.test(p.src))
  )
    return q;
  const rest = { ...q };
  delete rest.originalPages;
  const source = { ...q.source };
  delete source.pdf;
  return { ...rest, ...extras[q.id], source: { ...source, pages: [] } };
}
function clean(store: Store): Store {
  return {
    ...store,
    attempts: store.attempts.map((a) => {
      const exam = {
        ...a.exam,
        questions: a.exam.questions.map(withoutRemoved),
      };
      if (removed.test(exam.pdf ?? "")) delete exam.pdf;
      return { ...a, exam };
    }),
  };
}
export function decodeStore(raw: string | null): Store {
  if (!raw) return { version: 2, attempts: [] };
  const value: unknown = JSON.parse(raw);
  const parsed = storeSchema.safeParse(value);
  if (parsed.success) return clean(parsed.data);
  if (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "attempts" in value
  ) {
    const old = attemptSchema.array().safeParse(value.attempts);
    if (old.success) return clean({ version: 2, attempts: old.data });
  }
  throw new Error(
    "Formato de histórico incompatível. Exporte os dados antes de restaurar.",
  );
}
export function recover(store: Store): Store {
  return {
    ...store,
    attempts: store.attempts.map((a) => ({
      ...a,
      status: a.status === "finished" ? "finished" : "paused",
      anchor: null,
    })),
  };
}
export function upsert(store: Store, a: Attempt): Store {
  return {
    ...store,
    attempts: [a, ...store.attempts.filter((x) => x.id !== a.id)],
  };
}
export function save(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
