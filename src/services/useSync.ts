import { useCallback, useEffect, useRef, useState } from "react";
import type { Attempt } from "../types";
import {
  CHANGED_EVENT,
  mergeMarks,
  readMarks,
  sameMarks,
  writeMarks,
} from "./revisao";
import {
  AuthError,
  readSession,
  signIn as login,
  signOut as logout,
  syncAvailable,
  syncOnce,
  type Incoming,
} from "./sync";

export type SyncState = {
  available: boolean;
  email: string | null;
  busy: boolean;
  last: Date | null;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  now: () => void;
};

// Liga a conta ao estado do App. `attempts` é a lista atual, `merge` junta as
// tentativas que vieram de fora e `blocked` impede sincronizar um histórico
// que o navegador não conseguiu ler.
export function useSync(
  attempts: Attempt[],
  merge: (incoming: unknown[]) => void,
  blocked: boolean,
): SyncState {
  const available = syncAvailable();
  const [email, setEmail] = useState(() =>
    available ? (readSession()?.email ?? null) : null,
  );
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const current = useRef(attempts);
  current.current = attempts;
  const mergeRef = useRef(merge);
  mergeRef.current = merge;
  const running = useRef(false);
  const again = useRef(false);

  const run = useCallback(async () => {
    if (!available || blocked || !readSession()) return;
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    setBusy(true);
    try {
      do {
        again.current = false;
        await syncOnce(
          () => ({
            attempts: current.current.filter((a) => a.status !== "running"),
            marks: readMarks(),
          }),
          (incoming: Incoming) => {
            if (incoming.attempts.length) mergeRef.current(incoming.attempts);
            if (incoming.marks) {
              const mine = readMarks();
              const both = mergeMarks(mine, incoming.marks);
              if (!sameMarks(both, mine)) writeMarks(both);
            }
          },
        );
      } while (again.current);
      setLast(new Date());
      setError("");
    } catch (e) {
      if (e instanceof AuthError) setEmail(readSession()?.email ?? null);
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Não foi possível sincronizar.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [available, blocked]);

  // Ao abrir o site, ao entrar e ao voltar para a aba.
  useEffect(() => {
    if (!email) return;
    run();
    const visible = () => {
      if (!document.hidden) run();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", run);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", run);
    };
  }, [email, run]);

  // Depois de mudanças. Durante a prova a lista muda a cada segundo, então
  // a espera recomeça e a rodada só acontece quando a prova pausa ou acaba.
  useEffect(() => {
    if (!email) return;
    const t = setTimeout(run, 3000);
    return () => clearTimeout(t);
  }, [attempts, email, run]);

  useEffect(() => {
    if (!email) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const changed = () => {
      clearTimeout(t);
      t = setTimeout(run, 1500);
    };
    window.addEventListener(CHANGED_EVENT, changed);
    return () => {
      clearTimeout(t);
      window.removeEventListener(CHANGED_EVENT, changed);
    };
  }, [email, run]);

  return {
    available,
    email,
    busy,
    last,
    error,
    async signIn(address, password) {
      const s = await login(address, password);
      setError("");
      setEmail(s.email || address);
    },
    async signOut() {
      await logout();
      setEmail(null);
      setLast(null);
      setError("");
    },
    now: run,
  };
}
