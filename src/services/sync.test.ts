// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demo } from "../data/demo";
import { answer, createAttempt, finish, settle, pause } from "./session";
import {
  mergeMarks,
  readMarks,
  setMark,
  writeMarks,
  DONE_KEY,
  SPARE_KEY,
  type Marks,
} from "./revisao";
import type { Attempt } from "../types";

type SyncModule = typeof import("./sync");

// Um Supabase de mentira: guarda as linhas da tabela `dados` em memória e
// responde só ao que o site usa.
function fakeServer() {
  const rows = new Map<string, { chave: string; progresso: number; valor: unknown }>();
  const uploads: string[] = [];
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status });
    if (url.pathname === "/auth/v1/token") {
      const body = JSON.parse(String(init.body));
      if (body.password && body.password !== "certa")
        return json({ error_description: "Invalid login credentials" }, 400);
      return json({
        access_token: "acesso",
        refresh_token: "renova",
        expires_in: 3600,
        user: { id: "u1", email: "joao@exemplo.com" },
      });
    }
    if (url.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
    if (url.pathname === "/rest/v1/dados") {
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer acesso");
      if (init.method === "POST") {
        for (const r of JSON.parse(String(init.body))) {
          expect(r.user_id).toBe("u1");
          rows.set(r.chave, { chave: r.chave, progresso: r.progresso, valor: r.valor });
          uploads.push(r.chave);
        }
        return new Response(null, { status: 201 });
      }
      const filter = url.searchParams.get("chave");
      const wanted = filter
        ? JSON.parse(`[${filter.slice(4, -1)}]`) as string[]
        : null;
      const select = url.searchParams.get("select")!.split(",");
      return json(
        [...rows.values()]
          .filter((r) => !wanted || wanted.includes(r.chave))
          .map((r) =>
            Object.fromEntries(
              select.map((k) => [k, r[k as keyof typeof r]]),
            ),
          ),
      );
    }
    return json({}, 404);
  });
  return { rows, uploads, fetchMock };
}

// Um navegador: suas tentativas e suas marcas (as marcas ficam no
// localStorage, que é trocado entre um navegador e outro).
type Browser = { attempts: Attempt[]; storage: Record<string, string> };

let server: ReturnType<typeof fakeServer>;
let sync: SyncModule;

function use(b: Browser) {
  localStorage.clear();
  for (const [k, v] of Object.entries(b.storage)) localStorage.setItem(k, v);
}
function keep(b: Browser) {
  b.storage = { ...localStorage };
}
async function run(b: Browser) {
  use(b);
  await sync.syncOnce(
    () => ({
      attempts: b.attempts.filter((a) => a.status !== "running"),
      marks: readMarks(),
    }),
    (incoming) => {
      for (const raw of incoming.attempts) {
        const a = raw as Attempt;
        const mine = b.attempts.find((x) => x.id === a.id);
        if (mine && sync.attemptProgress(mine) >= sync.attemptProgress(a))
          continue;
        b.attempts = [...b.attempts.filter((x) => x.id !== a.id), a];
      }
      if (incoming.marks) writeMarks(mergeMarks(readMarks(), incoming.marks));
    },
  );
  keep(b);
}

function finished(id: string, at: number) {
  let a = createAttempt(demo, at, id);
  a = answer(a, "A", at + 1000);
  return finish(a, at + 5000);
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://exemplo.supabase.co/");
  vi.stubEnv("VITE_SUPABASE_KEY", "sb_publishable_teste");
  server = fakeServer();
  vi.stubGlobal("fetch", server.fetchMock);
  localStorage.clear();
  sync = await import("./sync");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Marcas do cronograma", () => {
  it("lê as marcas do formato antigo sem perder nada", () => {
    localStorage.setItem(DONE_KEY, JSON.stringify(["1:1:ITU", "2:1:DM"]));
    localStorage.setItem(SPARE_KEY, "sim");
    const m = readMarks();
    expect(m["1:1:ITU"]).toEqual({ on: true, at: 0 });
    expect(m["2:1:DM"]).toEqual({ on: true, at: 0 });
    expect(m.guardar).toEqual({ on: true, at: 0 });
  });
  it("junta pela mudança mais recente e, no empate, fica marcado", () => {
    const a: Marks = { x: { on: true, at: 0 }, y: { on: false, at: 10 } };
    const b: Marks = { x: { on: false, at: 0 }, y: { on: true, at: 5 }, z: { on: true, at: 3 } };
    expect(mergeMarks(a, b)).toEqual({
      x: { on: true, at: 0 },
      y: { on: false, at: 10 },
      z: { on: true, at: 3 },
    });
  });
  it("mantém o formato antigo atualizado ao marcar", () => {
    setMark("1:1:ITU", true, 100);
    setMark("guardar", true, 200);
    expect(JSON.parse(localStorage.getItem(DONE_KEY)!)).toEqual(["1:1:ITU"]);
    expect(localStorage.getItem(SPARE_KEY)).toBe("sim");
  });
});

describe("Plano de sincronização", () => {
  it("baixa o que está à frente lá e sobe o que está à frente aqui", () => {
    expect(
      sync.plan(
        [
          { key: "a", progress: 5 },
          { key: "b", progress: 1 },
          { key: "c", progress: 3 },
        ],
        [
          { key: "b", progress: 2 },
          { key: "c", progress: 3 },
          { key: "d", progress: 0 },
        ],
      ),
    ).toEqual({ download: ["b", "d"], upload: ["a"] });
  });
  it("terminar passa à frente de qualquer tempo de prova", () => {
    let open = createAttempt(demo, 0, "t");
    open = pause(settle(open, 9_000_000), 9_000_000);
    expect(sync.attemptProgress(finished("t", 0))).toBeGreaterThan(
      sync.attemptProgress(open),
    );
  });
});

describe("Sincronização entre navegadores", () => {
  it("entra e sai da conta", async () => {
    await expect(sync.signIn("joao@exemplo.com", "errada")).rejects.toThrow(
      "E-mail ou senha não conferem.",
    );
    expect(sync.readSession()).toBeNull();
    const s = await sync.signIn(" joao@exemplo.com ", "certa");
    expect(s.email).toBe("joao@exemplo.com");
    expect(sync.readSession()?.user).toBe("u1");
    await sync.signOut();
    expect(sync.readSession()).toBeNull();
  });

  it("soma o que cada navegador já tinha e não perde nada", async () => {
    await sync.signIn("joao@exemplo.com", "certa");
    const session = localStorage.getItem(sync.SESSION_KEY)!;
    const casa: Browser = {
      attempts: [finished("casa-1", 0)],
      storage: {
        [sync.SESSION_KEY]: session,
        [DONE_KEY]: JSON.stringify(["1:1:ITU"]),
      },
    };
    const plantao: Browser = {
      attempts: [finished("plantao-1", 1000)],
      storage: {
        [sync.SESSION_KEY]: session,
        [DONE_KEY]: JSON.stringify(["2:1:DM"]),
      },
    };
    await run(casa);
    await run(plantao);
    await run(casa);
    const ids = (b: Browser) => b.attempts.map((a) => a.id).sort();
    expect(ids(casa)).toEqual(["casa-1", "plantao-1"]);
    expect(ids(plantao)).toEqual(["casa-1", "plantao-1"]);
    for (const b of [casa, plantao]) {
      use(b);
      const m = readMarks();
      expect(m["1:1:ITU"]?.on).toBe(true);
      expect(m["2:1:DM"]?.on).toBe(true);
    }
    // Sem nada novo, nada sobe de novo.
    const before = server.uploads.length;
    await run(casa);
    expect(server.uploads.length).toBe(before);
  });

  it("leva a prova pausada para o outro navegador e fica com a mais adiantada", async () => {
    await sync.signIn("joao@exemplo.com", "certa");
    const session = localStorage.getItem(sync.SESSION_KEY)!;
    let prova = createAttempt(demo, 0, "p");
    prova = pause(settle(answer(prova, "B", 1000), 2000), 2000);
    const a: Browser = { attempts: [prova], storage: { [sync.SESSION_KEY]: session } };
    const b: Browser = { attempts: [], storage: { [sync.SESSION_KEY]: session } };
    await run(a);
    await run(b);
    expect(b.attempts[0].answers).toEqual(prova.answers);
    // Continua e termina no segundo navegador; o primeiro recebe o fim.
    b.attempts = [finish(b.attempts[0], 3000)];
    await run(b);
    await run(a);
    expect(a.attempts[0].status).toBe("finished");
  });

  it("não sobe a prova enquanto ela está aberta", async () => {
    await sync.signIn("joao@exemplo.com", "certa");
    const running = createAttempt(demo, 0, "r");
    const b: Browser = {
      attempts: [{ ...running, status: "running" }],
      storage: { [sync.SESSION_KEY]: localStorage.getItem(sync.SESSION_KEY)! },
    };
    await run(b);
    expect(server.rows.has("tentativa:r")).toBe(false);
  });

  it("uma desmarcação mais recente vale nos dois navegadores", async () => {
    await sync.signIn("joao@exemplo.com", "certa");
    const session = localStorage.getItem(sync.SESSION_KEY)!;
    const a: Browser = { attempts: [], storage: { [sync.SESSION_KEY]: session } };
    const b: Browser = { attempts: [], storage: { [sync.SESSION_KEY]: session } };
    use(a);
    setMark("1:1:ITU", true, 100);
    keep(a);
    await run(a);
    await run(b);
    use(b);
    setMark("1:1:ITU", false, 200);
    keep(b);
    await run(b);
    await run(a);
    use(a);
    expect(readMarks()["1:1:ITU"]).toEqual({ on: false, at: 200 });
  });
});
