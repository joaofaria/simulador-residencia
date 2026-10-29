import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import initSqlJs from "sql.js";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { parseApkg, type ParsedDeck } from "./apkg";
import {
  closeDb, deleteCollection, getCollection, importDeck, listCollections, loadCards, loadNote, saveAnswer,
} from "./db";
import { buildOfficial, OFFICIAL_ID, syncOfficial } from "./official";
import type { Exam, Question } from "../types";
import {
  answer, buildQueue, counts, dayNumber, deckTree, formatDelay, nextDelay, recordAnswer,
} from "./scheduler";
import { renderCard } from "./template";
import { defaultConf, type Card } from "./types";

const fixture = (n: string) =>
  new Uint8Array(readFileSync(new URL(`./fixtures/${n}`, import.meta.url)));
let SQL: Awaited<ReturnType<typeof initSqlJs>>;
beforeAll(async () => {
  SQL = await initSqlJs();
});

const NOW = Date.UTC(2026, 9, 28, 15, 0, 0);
const TODAY = dayNumber(NOW, 0);
const card = (over: Partial<Card> = {}): Card => ({
  key: "c:1", col: "c", id: 1, note: 1, ord: 0, deck: "A", state: "new", due: 0,
  ivl: 0, ease: 2.5, step: 0, reps: 0, lapses: 0, suspended: false, ...over,
});

describe.each([["teste-novo.apkg"], ["teste-legacy.apkg"]])("leitura de %s", (file) => {
  let deck: ParsedDeck;
  beforeAll(() => {
    deck = parseApkg(fixture(file), SQL, file, NOW);
  });
  it("traz baralhos, notas e cartões", () => {
    expect(deck.name).toBe("Teste");
    expect(deck.notes).toHaveLength(3);
    expect(deck.cards).toHaveLength(4);
    expect(new Set(deck.cards.map((c) => c.deck))).toEqual(
      new Set(["Teste::Clínica::Cardio", "Teste::Pediatria"]),
    );
    expect(deck.cards.every((c) => c.state === "new")).toBe(true);
  });
  it("traz os modelos e a configuração", () => {
    const models = Object.values(deck.models);
    expect(models.find((m) => m.name === "Basic")?.fields).toEqual(["Front", "Back"]);
    expect(models.find((m) => m.name === "Cloze")?.cloze).toBe(true);
    expect(deck.conf.newPerDay).toBe(20);
    expect(deck.conf.reviewsPerDay).toBe(200);
    expect(deck.conf.learnSteps).toEqual([1, 10]);
    expect(deck.conf.graduatingIvl).toBe(1);
    expect(deck.conf.easyIvl).toBe(4);
  });
  it("traz a mídia", () => {
    expect(deck.media.map((m) => m.name)).toEqual(["pixel.png"]);
    expect(deck.media[0].data.length).toBeGreaterThan(10);
  });
  it("monta frente e verso", () => {
    const cloze = deck.cards.filter((c) => deck.notes.find((n) => n.id === c.note)!.fields[0].includes("c1::"));
    expect(cloze).toHaveLength(2);
    const note = deck.notes.find((n) => n.id === cloze[0].note)!;
    const model = deck.models[String(note.model)];
    const c1 = renderCard(model, note.fields, note.tags, "x", 0);
    expect(c1.question).toContain("[...]");
    expect(c1.question).toContain("abdome agudo");
    expect(c1.answer).toContain('<span class="cloze">apendicite</span>');
    const c2 = renderCard(model, note.fields, note.tags, "x", 1);
    expect(c2.question).toContain("[tipo]");
    expect(c2.question).toContain("apendicite");
    const basic = deck.notes.find((n) => n.fields[0].startsWith("Qual"))!;
    const b = renderCard(deck.models[String(basic.model)], basic.fields, [], "x", 0);
    expect(b.question).toContain("Qual a primeira linha");
    expect(b.question).not.toContain("IECA");
    expect(b.answer).toContain("Qual a primeira linha");
    expect(b.answer).toContain("IECA");
    expect(b.answer).toContain('<hr id=answer>');
  });
});

describe("arquivos inválidos", () => {
  it("recusa o que não é .apkg", () => {
    expect(() => parseApkg(new Uint8Array([1, 2, 3, 4]), SQL)).toThrow(/não parece/);
  });
});

describe("gravação no navegador", () => {
  beforeEach(async () => {
    await closeDb();
    indexedDB = new IDBFactory();
  });
  it("importa, lista, lê e remove", async () => {
    const deck = parseApkg(fixture("teste-novo.apkg"), SQL, "x.apkg", NOW);
    const progress: number[] = [];
    const col = await importDeck(deck, "x.apkg", (f) => progress.push(f), NOW);
    expect(progress.at(-1)).toBe(1);
    expect((await listCollections()).map((c) => c.id)).toEqual([col.id]);
    const cards = await loadCards(col.id);
    expect(cards).toHaveLength(4);
    const note = await loadNote(col.id, cards[0].note);
    expect(note?.fields.length).toBeGreaterThan(0);
    await deleteCollection(col.id);
    expect(await listCollections()).toEqual([]);
    expect(await loadCards(col.id)).toEqual([]);
  });
});

describe("agendamento", () => {
  const c = defaultConf;
  it("novo: Errei e Bom entram nos passos, Fácil gradua", () => {
    const n = card();
    expect(nextDelay(n, 1, NOW, c, TODAY)).toBe(60_000);
    expect(nextDelay(n, 2, NOW, c, TODAY)).toBe(330_000);
    expect(nextDelay(n, 3, NOW, c, TODAY)).toBe(600_000);
    const easy = answer(n, 4, NOW, c, TODAY);
    expect(easy).toMatchObject({ state: "review", ivl: 4, due: TODAY + 4, ease: 2.5 });
  });
  it("aprendizado: Bom no último passo gradua com 1 dia", () => {
    const first = answer(card(), 3, NOW, c, TODAY);
    expect(first).toMatchObject({ state: "learn", step: 1 });
    const grad = answer(first, 3, NOW + 600_000, c, TODAY);
    expect(grad).toMatchObject({ state: "review", ivl: 1, due: TODAY + 1 });
  });
  it("revisão: Bom multiplica pela facilidade, Difícil por 1,2, Fácil pelo bônus", () => {
    const r = card({ state: "review", ivl: 10, due: TODAY, ease: 2.5 });
    expect(answer(r, 3, NOW, c, TODAY)).toMatchObject({ ivl: 25, ease: 2.5 });
    expect(answer(r, 2, NOW, c, TODAY)).toMatchObject({ ivl: 12, ease: 2.35 });
    expect(answer(r, 4, NOW, c, TODAY)).toMatchObject({ ivl: 33, ease: 2.65 });
  });
  it("revisão atrasada ganha parte do atraso no Bom", () => {
    const r = card({ state: "review", ivl: 10, due: TODAY - 4, ease: 2.5 });
    expect(answer(r, 3, NOW, c, TODAY).ivl).toBe(30);
  });
  it("errar uma revisão reinicia em reaprendizado e baixa a facilidade", () => {
    const r = card({ state: "review", ivl: 30, due: TODAY, ease: 2.5 });
    const lapsed = answer(r, 1, NOW, c, TODAY);
    expect(lapsed).toMatchObject({ state: "relearn", lapses: 1, ease: 2.3, ivl: 1 });
    expect(lapsed.due).toBe(NOW + 600_000);
    const back = answer(lapsed, 3, NOW + 600_000, c, TODAY);
    expect(back).toMatchObject({ state: "review", ivl: 1, due: TODAY + 1 });
  });
  it("a facilidade nunca cai de 130%", () => {
    let r = card({ state: "review", ivl: 5, due: TODAY, ease: 1.35 });
    r = answer(r, 1, NOW, c, TODAY);
    expect(r.ease).toBe(1.3);
  });
  it("formata prazos", () => {
    expect(formatDelay(30_000)).toBe("<1 min");
    expect(formatDelay(600_000)).toBe("10 min");
    expect(formatDelay(86_400_000)).toBe("1 d");
    expect(formatDelay(86_400_000 * 45)).toBe("1,5 mês");
  });
});

describe("fila do dia", () => {
  const cards = [
    ...Array.from({ length: 30 }, (_, i) => card({ key: `c:${i}`, id: i, due: i, deck: "R::A" })),
    card({ key: "c:r", id: 100, deck: "R::B", state: "review", ivl: 5, due: TODAY - 1 }),
    card({ key: "c:f", id: 101, deck: "R::B", state: "review", ivl: 5, due: TODAY + 3 }),
    card({ key: "c:l", id: 102, deck: "R::B", state: "learn", due: NOW - 1000 }),
    card({ key: "c:s", id: 103, deck: "R::B", suspended: true }),
  ];
  const col = {
    id: "c", name: "R", fileName: "r", importedAt: "", models: {}, cardCount: 0, conf: defaultConf,
    today: { day: TODAY, done: {} as Record<string, { new: number; review: number }> },
  };
  const root = () => deckTree(cards)[0];
  it("respeita o limite de novos e ignora suspensos e revisões futuras", () => {
    const q = buildQueue(root(), col, NOW, TODAY);
    expect(counts(q)).toEqual({ fresh: 20, learn: 1, review: 1 });
  });
  it("os limites contam o que já foi estudado hoje, no baralho e nos pais", () => {
    let next = col;
    for (let i = 0; i < 5; i++) next = recordAnswer(next, cards[i], TODAY);
    expect(next.today.done["R"].new).toBe(5);
    expect(next.today.done["R::A"].new).toBe(5);
    expect(counts(buildQueue(root(), next, NOW, TODAY)).fresh).toBe(15);
  });
  it("contadores de outro dia são ignorados", () => {
    const old = { ...col, today: { day: TODAY - 1, done: { R: { new: 20, review: 0 } } } };
    expect(counts(buildQueue(root(), old, NOW, TODAY)).fresh).toBe(20);
  });
});

describe("cartões com imagem", () => {
  const file = () => fixture("teste-imagens.apkg");
  it("sem a opção, importa todos", () => {
    expect(parseApkg(file(), SQL, "i.apkg", NOW).cards).toHaveLength(4);
  });
  it("com a opção, deixa de fora link externo e figura que falta", () => {
    const d = parseApkg(file(), SQL, "i.apkg", NOW, { skipUnavailableImages: true });
    expect(d.skipped).toBe(2);
    expect(d.cards).toHaveLength(2);
    expect(d.notes.map((n) => n.fields[0]).sort()).toEqual([
      "Cartão com figura embutida",
      "Cartão sem imagem",
    ]);
    expect(d.media.map((m) => m.name)).toEqual(["figura.png"]);
  });
});

describe("cards das provas", () => {
  beforeEach(async () => {
    await closeDb();
    indexedDB = new IDBFactory();
  });
  const exam = (over: Partial<Exam> = {}): Exam => ({
    id: "x-2026", institution: "X", year: 2026, title: "X • 2026", demo: false,
    questions: [
      q(1, { answer: "B" }),
      q(2, { annulled: true }),
      q(3, { answer: "A", figure: true }),
    ],
    ...over,
  });
  function q(n: number, o: { answer?: string; annulled?: boolean; figure?: boolean }): Question {
    return {
      id: `x-2026-q${n}`, institution: "X", year: 2026, number: n, area: "pediatria",
      statement: o.figure ? "Veja <b>a figura</b>.\n{{figura}}\nQual o diagnóstico?" : "Enunciado & mais",
      alternatives: [{ letter: "A", text: "primeira" }, { letter: "B", text: "segunda" }],
      key: o.annulled
        ? { status: "annulled", source: "banca" }
        : { status: "verified", answer: o.answer!, source: "banca", basis: "official" },
      images: o.figure ? [{ src: "provas/figuras/x/q003.jpg", alt: "ECG" }] : [],
      tables: o.figure ? [{ header: ["a"], rows: [["1"]] }] : undefined,
      source: { pages: [] }, review: "approved",
    };
  }
  it("monta um cartão por questão com gabarito", () => {
    const { notes, cards } = buildOfficial([exam()], "/base/");
    expect(cards).toHaveLength(2);
    expect(cards.every((c) => c.deck === "Provas oficiais::Pediatria::X 2026")).toBe(true);
    expect(notes[0].fields[0]).toBe("<p>Enunciado &amp; mais</p>");
    expect(notes[0].fields[2]).toContain("<b>B</b> (segunda)");
    expect(notes[0].fields[3]).toBe("X 2026, questão 1");
  });
  it("põe tabela e figura onde está a marca", () => {
    const { notes } = buildOfficial([exam()], "/base/");
    const html = notes[1].fields[0];
    expect(html.indexOf("a figura")).toBeLessThan(html.indexOf("<table"));
    expect(html.indexOf("<table")).toBeLessThan(html.indexOf("Qual o diagnóstico"));
    expect(html).toContain('<img src="/base/provas/figuras/x/q003.jpg" alt="ECG">');
  });
  it("avisa quando o gabarito não é da banca", () => {
    const e = exam({ keySource: { type: "third-party" } });
    expect(buildOfficial([e], "/").notes[0].fields[3]).toContain("outra fonte");
  });
  it("ignora prova de demonstração", () => {
    expect(buildOfficial([exam({ demo: true })], "/").cards).toEqual([]);
  });
  it("os ids não mudam entre gerações", () => {
    const a = buildOfficial([exam()], "/").cards.map((c) => c.id);
    const b = buildOfficial([exam()], "/").cards.map((c) => c.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });
  it("atualizar acrescenta o que é novo e preserva o progresso", async () => {
    const first = await syncOfficial(NOW, [exam({ questions: [q(1, { answer: "B" })] })]);
    expect(first).toEqual({ added: 1, total: 1 });
    const [card] = await loadCards(OFFICIAL_ID);
    await saveAnswer((await getCollection(OFFICIAL_ID))!, { ...card, state: "review", ivl: 9, reps: 3 });
    const second = await syncOfficial(NOW, [exam()]);
    expect(second).toEqual({ added: 1, total: 2 });
    const cards = await loadCards(OFFICIAL_ID);
    expect(cards.find((c) => c.id === card.id)).toMatchObject({ state: "review", ivl: 9, reps: 3 });
    const again = await syncOfficial(NOW, [exam()]);
    expect(again.added).toBe(0);
    const col = await getCollection(OFFICIAL_ID);
    expect(col).toMatchObject({ source: "provas", cardCount: 2 });
  });
});
