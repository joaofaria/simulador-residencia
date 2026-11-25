// Conta e sincronização entre navegadores, pelo Supabase.
//
// O navegador continua sendo a base: sem conta tudo funciona como antes. Com
// a conta, cada tentativa vira uma linha na tabela `dados` (chave
// "tentativa:<id>") e as marcas do cronograma do IPSEMG viram a linha
// "revisao". Nada é apagado nem sobrescrito às cegas: as tentativas se somam
// por id, e quando a mesma existe dos dois lados vale a mais adiantada; as
// marcas se juntam tópico a tópico. Os flashcards ficam fora.
//
// O endereço e a chave pública do projeto ficam logo abaixo; as variáveis de
// build VITE_SUPABASE_URL e VITE_SUPABASE_KEY podem trocá-los.

import type { Attempt } from "../types";
import { isMarks, mergeMarks, sameMarks, type Marks } from "./revisao";

// Projeto do site no Supabase. A chave "publishable" é pública por natureza
// (vai no JavaScript de qualquer jeito) e só alcança o que as regras da tabela
// permitem. As variáveis de build, quando existem, têm prioridade.
const SUPABASE_URL = "https://xigcwhmlvugfhfxlpsqp.supabase.co";
const SUPABASE_KEY = "sb_publishable_IvL71kCOKcJ9Y17MrBWE0g_phWLxtz-";

export const config = {
  url: (import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL).replace(/\/+$/, ""),
  key: import.meta.env.VITE_SUPABASE_KEY || SUPABASE_KEY,
};
export const syncAvailable = () => !!(config.url && config.key);

export const SESSION_KEY = "residencia.conta";
export const ATTEMPT_PREFIX = "tentativa:";
export const MARKS_ROW = "revisao";

export type Session = {
  access: string;
  refresh: string;
  // Milissegundos desde 1970, como Date.now().
  expires: number;
  email: string;
  user: string;
};

export class AuthError extends Error {}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const s = raw ? (JSON.parse(raw) as Session) : null;
    return s?.access && s.refresh && s.user ? s : null;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Sem armazenamento, a conta vale só nesta visita. */
  }
}

type TokenReply = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
  error_description?: string;
  msg?: string;
};

async function grant(type: "password" | "refresh_token", body: object) {
  const res = await fetch(`${config.url}/auth/v1/token?grant_type=${type}`, {
    method: "POST",
    headers: { apikey: config.key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as TokenReply;
  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403)
      throw new AuthError(
        type === "password"
          ? "E-mail ou senha não conferem."
          : "A sessão expirou. Entre de novo.",
      );
    throw new Error("Não foi possível falar com o servidor da conta.");
  }
  const s: Session = {
    access: data.access_token,
    refresh: data.refresh_token,
    expires: Date.now() + data.expires_in * 1000,
    email: data.user.email ?? "",
    user: data.user.id,
  };
  writeSession(s);
  return s;
}

export function signIn(email: string, password: string) {
  return grant("password", { email: email.trim(), password });
}

export async function signOut() {
  const s = readSession();
  writeSession(null);
  if (s)
    await fetch(`${config.url}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: config.key, Authorization: `Bearer ${s.access}` },
    }).catch(() => undefined);
}

let refreshing: Promise<Session> | null = null;
async function session(): Promise<Session> {
  // Lê de novo a cada vez: outra aba pode ter renovado a sessão.
  const s = readSession();
  if (!s) throw new AuthError("Entre na conta para sincronizar.");
  if (s.expires - Date.now() > 60_000) return s;
  refreshing ??= grant("refresh_token", { refresh_token: s.refresh }).finally(
    () => {
      refreshing = null;
    },
  );
  try {
    return await refreshing;
  } catch (e) {
    if (e instanceof AuthError) writeSession(null);
    throw e;
  }
}

async function rest(path: string, init: RequestInit = {}) {
  const s = await session();
  const res = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${s.access}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (res.status === 401) {
    writeSession(null);
    throw new AuthError("A sessão expirou. Entre de novo.");
  }
  if (!res.ok) throw new Error("O servidor recusou a sincronização.");
  return res;
}

export type Entry = { key: string; progress: number };
export type Row = Entry & { value: unknown };
type DbRow = { chave: string; progresso: number; valor?: unknown };

// Quanto uma tentativa já andou. Só cresce: o tempo de prova soma enquanto
// ela está aberta, e terminar passa à frente de qualquer tempo.
export function attemptProgress(a: Attempt) {
  return (a.status === "finished" ? 1e13 : 0) + Math.round(a.totalMs);
}

// O que baixar e o que subir, comparando o quanto cada lado andou.
export function plan(local: Entry[], remote: Entry[]) {
  const theirs = new Map(remote.map((e) => [e.key, e.progress]));
  const mine = new Map(local.map((e) => [e.key, e.progress]));
  return {
    download: remote
      .filter((e) => e.progress > (mine.get(e.key) ?? -1))
      .map((e) => e.key),
    upload: local
      .filter((e) => e.progress > (theirs.get(e.key) ?? -1))
      .map((e) => e.key),
  };
}

// Valores entre aspas no filtro in.(...) do PostgREST.
const quote = (k: string) => `"${k.replace(/["\\]/g, (c) => `\\${c}`)}"`;

async function listRemote(): Promise<Entry[]> {
  const res = await rest("dados?select=chave,progresso");
  return ((await res.json()) as DbRow[]).map((r) => ({
    key: r.chave,
    progress: Number(r.progresso),
  }));
}

async function fetchRows(keys: string[]): Promise<Row[]> {
  const rows: Row[] = [];
  // Poucas por vez: cada tentativa leva a prova inteira junto.
  for (let i = 0; i < keys.length; i += 10) {
    const list = keys.slice(i, i + 10).map(quote).join(",");
    const res = await rest(
      `dados?select=chave,progresso,valor&chave=in.(${encodeURIComponent(list)})`,
    );
    for (const r of (await res.json()) as DbRow[])
      rows.push({ key: r.chave, progress: Number(r.progresso), value: r.valor });
  }
  return rows;
}

async function pushRows(rows: Row[]) {
  const s = await session();
  for (let i = 0; i < rows.length; i += 10)
    await rest("dados?on_conflict=user_id,chave", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(
        rows.slice(i, i + 10).map((r) => ({
          user_id: s.user,
          chave: r.key,
          progresso: r.progress,
          valor: r.value,
        })),
      ),
    });
}

export type Local = {
  // Tentativas que podem subir agora. A que está aberta fica de fora até
  // pausar ou terminar, para não mandar a prova inteira a cada segundo.
  attempts: Attempt[];
  marks: Marks;
};

export type Incoming = { attempts: unknown[]; marks: Marks | null };

// Uma rodada completa: baixa o que o outro lado tem de mais novo, entrega a
// `apply` para juntar com o que está no navegador e sobe o que só existe ou
// está mais adiantado aqui.
export async function syncOnce(
  read: () => Local,
  apply: (incoming: Incoming) => void,
) {
  const remote = await listRemote();
  const attemptsOf = (l: Local): Entry[] =>
    l.attempts.map((a) => ({
      key: ATTEMPT_PREFIX + a.id,
      progress: attemptProgress(a),
    }));
  const remoteAttempts = remote.filter((e) =>
    e.key.startsWith(ATTEMPT_PREFIX),
  );
  const first = plan(attemptsOf(read()), remoteAttempts);
  const hasMarks = remote.some((e) => e.key === MARKS_ROW);
  const rows = await fetchRows([
    ...first.download,
    ...(hasMarks ? [MARKS_ROW] : []),
  ]);
  const remoteMarksRow = rows.find((r) => r.key === MARKS_ROW);
  const remoteMarks =
    remoteMarksRow && isMarks(remoteMarksRow.value)
      ? remoteMarksRow.value
      : null;
  apply({
    attempts: rows.filter((r) => r.key !== MARKS_ROW).map((r) => r.value),
    marks: remoteMarks,
  });
  // Depois de juntar, sobe o que ainda está à frente aqui.
  const local = read();
  const byKey = new Map(local.attempts.map((a) => [ATTEMPT_PREFIX + a.id, a]));
  const up: Row[] = plan(attemptsOf(local), remoteAttempts).upload.map(
    (key) => {
      const a = byKey.get(key)!;
      return { key, progress: attemptProgress(a), value: a };
    },
  );
  const merged = remoteMarks ? mergeMarks(remoteMarks, local.marks) : local.marks;
  if (!remoteMarks || !sameMarks(merged, remoteMarks))
    up.push({
      key: MARKS_ROW,
      progress: Object.values(merged).reduce((m, x) => Math.max(m, x.at), 0),
      value: merged,
    });
  await pushRows(up);
  return { downloaded: first.download.length, uploaded: up.length };
}
