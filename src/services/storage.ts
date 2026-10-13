import { storeSchema, attemptSchema, type Store, type Attempt } from "../types";
export const STORAGE_KEY = "residencia.store";
export function decodeStore(raw: string | null): Store {
  if (!raw) return { version: 2, attempts: [] };
  const value: unknown = JSON.parse(raw);
  const parsed = storeSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  if (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "attempts" in value
  ) {
    const old = attemptSchema.array().safeParse(value.attempts);
    if (old.success) return { version: 2, attempts: old.data };
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
