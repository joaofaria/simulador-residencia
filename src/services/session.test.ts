import { describe, it, expect, vi, afterEach } from "vitest";
import { demo } from "../data/demo";
import {
  createAttempt,
  settle,
  pause,
  resume,
  navigate,
  answer,
  finish,
  score,
  scoreByArea,
  scoreMessage,
  formatTime,
} from "./session";
import { decodeStore, recover, upsert, save, STORAGE_KEY } from "./storage";
describe("Cronômetros e navegação", () => {
  it("inicia e acumula tempo real por questão, inclusive ao retornar", () => {
    let a = createAttempt(demo, 0, "a");
    a = navigate(a, 1, 5000);
    a = navigate(a, 0, 8000);
    a = settle(a, 12000);
    expect(a.totalMs).toBe(12000);
    expect(a.times).toEqual({ "demo-1": 9000, "demo-2": 3000 });
  });
  it("exclui interrupções e não duplica a contagem", () => {
    let a = createAttempt(demo, 0, "a");
    a = pause(a, 5000);
    a = settle(a, 100000);
    a = resume(a, 200000);
    a = settle(a, 202000);
    a = settle(a, 202000);
    expect(a.totalMs).toBe(7000);
    expect(a.times["demo-1"]).toBe(7000);
  });
  it("não retrocede tempo nem navega fora da prova", () => {
    const a = createAttempt(demo, 10000, "a");
    expect(settle(a, 9000).totalMs).toBe(0);
    expect(navigate(a, -1, 20000)).toEqual(a);
    expect(navigate(a, 3, 20000)).toEqual(a);
  });
  it("retomar uma sessão já ativa não perde tempo", () => {
    const a = createAttempt(demo, 0, "a");
    expect(settle(resume(a, 5000), 6000).totalMs).toBe(6000);
  });
  it("impede alterações após a finalização", () => {
    const a = finish(createAttempt(demo, 0, "a"), 1000);
    expect(answer(a, "A", 2000)).toEqual(a);
    expect(navigate(a, 1, 2000)).toEqual(a);
    expect(finish(a, 2000)).toEqual(a);
  });
  it("para definitivamente ao finalizar", () => {
    const a = finish(createAttempt(demo, 0, "a"), 5000);
    expect(settle(resume(a, 10000), 20000).totalMs).toBe(5000);
    expect(a.anchor).toBeNull();
  });
});
describe("Respostas e pontuação", () => {
  it("permite responder, alterar e limpar", () => {
    let a = createAttempt(demo, 0, "a");
    a = answer(a, "A", 100);
    a = answer(a, "B", 200);
    expect(a.answers["demo-1"]).toBe("B");
    a = answer(a, undefined, 300);
    expect(a.answers).toEqual({});
  });
  it("exclui anuladas e pendentes; pontua apenas gabarito verificado", () => {
    let a = answer(createAttempt(demo, 0, "a"), "A", 1000);
    a = finish(a, 9000);
    expect(score(a)).toMatchObject({
      correct: 1,
      incorrect: 0,
      blank: 0,
      annulled: 1,
      pending: 1,
      valid: 1,
      percentage: 100,
      averageMs: 3000,
    });
  });
  it("questão válida em branco conta no denominador", () => {
    const s = score(finish(createAttempt(demo, 0, "a"), 3000));
    expect(s.percentage).toBe(0);
    expect(s.blank).toBe(1);
    expect(s.averageMs).toBe(1000);
  });
  it("conta erro sem confundir com branco", () => {
    expect(score(answer(createAttempt(demo, 0, "a"), "B", 0)).incorrect).toBe(
      1,
    );
  });
  it("não produz percentual definitivo sem questões verificadas", () => {
    const exam = { ...demo, questions: [demo.questions[2]] };
    expect(score(createAttempt(exam, 0, "a")).percentage).toBeNull();
  });
  it("preserva cópia da prova no histórico", () => {
    const exam = structuredClone(demo);
    const a = createAttempt(exam, 0, "a");
    exam.questions[0].statement = "alterado";
    expect(a.exam.questions[0].statement).not.toBe("alterado");
  });
  it("formata horas sem reiniciar após 24h", () =>
    expect(formatTime(90061000)).toBe("25:01:01"));
});
describe("Persistência e evolução de formato", () => {
  it("recupera respostas, posição e tempos, pausando sem contar ausência", () => {
    let a = answer(createAttempt(demo, 0, "a"), "A", 2000);
    a = navigate(a, 1, 5000);
    const stored = decodeStore(JSON.stringify({ version: 2, attempts: [a] }));
    const restored = recover(stored).attempts[0];
    expect(restored.answers["demo-1"]).toBe("A");
    expect(restored.current).toBe(1);
    expect(restored.totalMs).toBe(5000);
    expect(restored.anchor).toBeNull();
    expect(settle(restored, 999999).totalMs).toBe(5000);
  });
  it("mantém múltiplas tentativas", () => {
    let s = decodeStore(null);
    s = upsert(s, createAttempt(demo, 0, "a"));
    s = upsert(s, createAttempt(demo, 0, "b"));
    expect(s.attempts).toHaveLength(2);
  });
  it("migra versão 1 sem perder histórico", () =>
    expect(
      decodeStore(
        JSON.stringify({ version: 1, attempts: [createAttempt(demo, 0, "a")] }),
      ).version,
    ).toBe(2));
  it("rejeita formato futuro e dados corrompidos", () => {
    expect(() => decodeStore("{")).toThrow();
    expect(() => decodeStore('{"version":99,"attempts":[]}')).toThrow();
  });
});

describe("Armazenamento no navegador", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("salva e recupera as respostas no localStorage", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      setItem: (key: string, value: string) => values.set(key, value),
      getItem: (key: string) => values.get(key) ?? null,
    });
    const attempt = answer(createAttempt(demo, 0, "persistida"), "A", 2000);
    save({ version: 2, attempts: [attempt] });
    const restored = recover(decodeStore(localStorage.getItem(STORAGE_KEY)))
      .attempts[0];
    expect(restored.answers["demo-1"]).toBe("A");
    expect(restored.totalMs).toBe(2000);
    expect(restored.status).toBe("paused");
  });
  it("propaga falha de gravação para impedir perda silenciosa", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("Quota excedida");
      },
    });
    expect(() => save({ version: 2, attempts: [] })).toThrow("Quota excedida");
  });
});

it("persiste o resultado calculado na tentativa finalizada", () => {
  const attempt = finish(
    answer(createAttempt(demo, 0, "resultado"), "A", 2000),
    6000,
  );
  const recovered = decodeStore(
    JSON.stringify({ version: 2, attempts: [attempt] }),
  ).attempts[0];
  expect(recovered.result).toMatchObject({
    correct: 1,
    percentage: 100,
    averageMs: 2000,
    total: 3,
  });
  expect(score(recovered)).toEqual(recovered.result);
});

it("não inicia provas vazias ou transcrições sem revisão", () => {
  expect(() => createAttempt({ ...demo, questions: [] }, 0, "vazia")).toThrow(
    "sem questões",
  );
  const pending = structuredClone(demo);
  pending.questions[0].review = "required";
  expect(() => createAttempt(pending, 0, "pendente")).toThrow(
    "pendentes de revisão",
  );
});
describe("Desempenho por área", () => {
  const exam = {
    ...demo,
    questions: [
      { ...demo.questions[0], id: "x1", area: "pediatria" as const },
      { ...demo.questions[0], id: "x2", area: "pediatria" as const },
      { ...demo.questions[0], id: "x3", area: "cirurgia" as const },
      { ...demo.questions[1], id: "x4", area: "cirurgia" as const },
      { ...demo.questions[2], id: "x5", area: "go" as const },
    ],
  };
  it("conta acertos sobre válidas e ignora anuladas e pendentes", () => {
    let a = createAttempt(exam, 0, "a");
    a = answer(a, "A", 1000);
    a = navigate(a, 1, 1000);
    a = answer(a, "B", 2000);
    a = navigate(a, 3, 2000);
    a = answer(a, "A", 3000);
    expect(scoreByArea([a])).toEqual([
      { area: "cirurgia", correct: 0, valid: 1, percentage: 0 },
      { area: "pediatria", correct: 1, valid: 2, percentage: 50 },
    ]);
  });
  it("soma tentativas e usa o mapa para provas salvas sem área", () => {
    const old = {
      ...exam,
      questions: exam.questions.map(({ area: _, ...q }) => q),
    };
    const a = { ...createAttempt(exam, 0, "a"), answers: { x1: "A" } };
    const b = { ...createAttempt(old, 0, "b"), answers: { x1: "A" } };
    expect(scoreByArea([b])).toEqual([]);
    expect(scoreByArea([a, b], { x1: "pediatria", x2: "pediatria" })).toEqual([
      { area: "cirurgia", correct: 0, valid: 1, percentage: 0 },
      { area: "pediatria", correct: 2, valid: 4, percentage: 50 },
    ]);
  });
});

describe("Mensagem por faixa de aproveitamento", () => {
  it("separa as faixas em 85%, 80% e 70%", () => {
    expect(scoreMessage(100)).toMatch(/^Top top/);
    expect(scoreMessage(85)).toMatch(/^Top top/);
    expect(scoreMessage(84.96)).toMatch(/^Top top/);
    expect(scoreMessage(84.9)).toMatch(/^Top, provavelmente/);
    expect(scoreMessage(80)).toMatch(/^Top, provavelmente/);
    expect(scoreMessage(79.9)).toMatch(/^Tem chance/);
    expect(scoreMessage(70)).toMatch(/^Tem chance/);
    expect(scoreMessage(69.9)).toMatch(/^Precisa melhorar muito/);
    expect(scoreMessage(0)).toMatch(/^Precisa melhorar muito/);
  });
  it("devolve nada quando não há questão válida", () => {
    expect(scoreMessage(null)).toBeNull();
  });
});
