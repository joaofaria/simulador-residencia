import { unzipSync } from "fflate";
import { decompress } from "fzstd";
import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import {
  decodeProto,
  protoFloats,
  protoNumber,
  protoString,
} from "./proto";
import { dayNumber } from "./scheduler";
import {
  defaultConf,
  DECK_SEPARATOR,
  type Card,
  type Conf,
  type Model,
  type Note,
} from "./types";

// Lê um .apkg (exportado pelo Anki antigo ou novo) e devolve modelos, notas,
// cartões e mídia. Tudo acontece no navegador; nada é enviado.

export type ParsedNote = Omit<Note, "key" | "col">;
export type ParsedCard = Omit<Card, "key" | "col">;
export type ParsedDeck = {
  name: string;
  models: Record<string, Model>;
  conf: Conf;
  notes: ParsedNote[];
  cards: ParsedCard[];
  media: { name: string; data: Uint8Array }[];
  // Cartões deixados de fora por terem imagem que não vem dentro do arquivo.
  skipped: number;
};

export type ParseOptions = { skipUnavailableImages?: boolean };

const IMG_SRC = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

// Imagem que só existe como link externo ou que falta no arquivo: não há como
// guardá-la no navegador, e o link pode sair do ar (aconteceu com o Osler).
function hasUnavailableImage(html: string, have: Set<string>) {
  for (const m of html.matchAll(IMG_SRC)) {
    const src = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (src.startsWith("data:")) continue;
    let name = src;
    try {
      name = decodeURIComponent(src);
    } catch {
      /* Nome com % solto: compara como está. */
    }
    if (!have.has(name) && !have.has(src)) return true;
  }
  return false;
}

const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd];
function maybeZstd(data: Uint8Array) {
  return ZSTD_MAGIC.every((b, i) => data[i] === b) ? decompress(data) : data;
}

function rows(db: Database, sql: string): SqlValue[][] {
  const stmt = db.prepare(sql);
  const out: SqlValue[][] = [];
  try {
    while (stmt.step()) out.push(stmt.get());
  } finally {
    stmt.free();
  }
  return out;
}

function hasTable(db: Database, name: string) {
  return rows(db, `select 1 from sqlite_master where type='table' and name='${name}'`)
    .length > 0;
}

const utf8 = new TextDecoder();

type LegacyModel = {
  name: string;
  type: number;
  css: string;
  flds: { name: string; ord: number }[];
  tmpls: { name: string; ord: number; qfmt: string; afmt: string }[];
};

function legacyModels(db: Database): Record<string, Model> {
  const raw = JSON.parse(String(rows(db, "select models from col")[0][0])) as
    Record<string, LegacyModel>;
  const out: Record<string, Model> = {};
  for (const [id, m] of Object.entries(raw))
    out[id] = {
      id: Number(id),
      name: m.name,
      cloze: m.type === 1,
      css: m.css,
      fields: [...m.flds].sort((a, b) => a.ord - b.ord).map((f) => f.name),
      templates: [...m.tmpls]
        .sort((a, b) => a.ord - b.ord)
        .map(({ name, qfmt, afmt }) => ({ name, qfmt, afmt })),
    };
  return out;
}

function modernModels(db: Database): Record<string, Model> {
  const out: Record<string, Model> = {};
  for (const [id, name, config] of rows(db, "select id, name, config from notetypes")) {
    const m = decodeProto(config as Uint8Array);
    out[String(id)] = {
      id: Number(id),
      name: String(name),
      cloze: protoNumber(m, 1) === 1,
      css: protoString(m, 3),
      fields: [],
      templates: [],
    };
  }
  for (const [ntid, name] of rows(db, "select ntid, name from fields order by ntid, ord"))
    out[String(ntid)]?.fields.push(String(name));
  for (const [ntid, name, config] of rows(
    db,
    "select ntid, name, config from templates order by ntid, ord",
  )) {
    const t = decodeProto(config as Uint8Array);
    out[String(ntid)]?.templates.push({
      name: String(name),
      qfmt: protoString(t, 1),
      afmt: protoString(t, 2),
    });
  }
  return out;
}

function deckNames(db: Database, modern: boolean): Map<number, string> {
  if (modern)
    return new Map(
      rows(db, "select id, name from decks").map(([id, name]) => [
        Number(id),
        String(name).split("\x1f").join(DECK_SEPARATOR),
      ]),
    );
  const raw = JSON.parse(String(rows(db, "select decks from col")[0][0])) as
    Record<string, { name: string }>;
  return new Map(Object.entries(raw).map(([id, d]) => [Number(id), d.name]));
}

type LegacyConf = {
  new: { delays: number[]; ints: number[]; initialFactor: number; perDay: number };
  rev: { perDay: number; ease4: number; ivlFct?: number; maxIvl: number; hardFactor?: number };
  lapse: { delays: number[]; mult: number; minInt: number };
};

function readConf(db: Database, modern: boolean): Conf {
  if (modern) {
    const first = rows(db, "select config from deck_config order by id limit 1")[0];
    if (!first) return defaultConf;
    const m = decodeProto(first[0] as Uint8Array);
    const n = (field: number, fallback: number) => protoNumber(m, field) || fallback;
    return {
      newPerDay: protoNumber(m, 9) ?? 0,
      reviewsPerDay: protoNumber(m, 10) ?? 0,
      learnSteps: protoFloats(m, 1),
      relearnSteps: protoFloats(m, 2),
      initialEase: n(11, defaultConf.initialEase),
      easyBonus: n(12, defaultConf.easyBonus),
      hardFactor: n(13, defaultConf.hardFactor),
      lapseMult: protoNumber(m, 14) ?? 0,
      ivlModifier: n(15, defaultConf.ivlModifier),
      maxIvl: n(16, defaultConf.maxIvl),
      minLapseIvl: n(17, defaultConf.minLapseIvl),
      graduatingIvl: n(18, defaultConf.graduatingIvl),
      easyIvl: n(19, defaultConf.easyIvl),
    };
  }
  const all = JSON.parse(String(rows(db, "select dconf from col")[0][0])) as
    Record<string, LegacyConf>;
  const c = all["1"] ?? Object.values(all)[0];
  if (!c) return defaultConf;
  return {
    newPerDay: c.new.perDay,
    reviewsPerDay: c.rev.perDay,
    learnSteps: c.new.delays,
    relearnSteps: c.lapse.delays,
    graduatingIvl: c.new.ints[0] ?? defaultConf.graduatingIvl,
    easyIvl: c.new.ints[1] ?? defaultConf.easyIvl,
    initialEase: c.new.initialFactor / 1000,
    easyBonus: c.rev.ease4,
    hardFactor: c.rev.hardFactor ?? defaultConf.hardFactor,
    ivlModifier: c.rev.ivlFct ?? 1,
    maxIvl: c.rev.maxIvl,
    lapseMult: c.lapse.mult,
    minLapseIvl: c.lapse.minInt,
  };
}

function readMedia(files: Record<string, Uint8Array>) {
  const index = files.media;
  if (!index?.length) return [];
  const raw = maybeZstd(index);
  let names: [string, string][];
  if (raw[0] === 0x7b) {
    // Formato antigo: JSON {"0": "figura.png"}.
    names = Object.entries(JSON.parse(utf8.decode(raw)) as Record<string, string>);
  } else {
    // Formato novo: protobuf com uma entrada por arquivo, na ordem dos nomes 0, 1, 2...
    const entries = decodeProto(raw).get(1) ?? [];
    names = entries.map((e, i) => [String(i), protoString(decodeProto(e as Uint8Array), 1)]);
  }
  return names
    .filter(([file]) => files[file])
    .map(([file, name]) => ({ name, data: maybeZstd(files[file]) }));
}

// Nome do baralho importado: a raiz comum dos cartões, ou o nome do arquivo.
function rootName(cards: ParsedCard[], fallback: string) {
  const roots = new Set(cards.map((c) => c.deck.split(DECK_SEPARATOR)[0]));
  return roots.size === 1 ? [...roots][0] : fallback;
}

// O Anki novo declara as colunas de nome com a ordenação "unicase", que o
// SQLite do navegador não tem. Como só lemos por chave, basta tirar a
// declaração do esquema e reabrir.
function open(SQL: SqlJsStatic, raw: Uint8Array): Database {
  const db = new SQL.Database(raw);
  if (!rows(db, "select 1 from sqlite_master where sql like '%unicase%' limit 1").length)
    return db;
  db.exec(
    `pragma writable_schema=1;
     update sqlite_master set sql=replace(sql,'COLLATE unicase','') where sql like '%unicase%';
     pragma writable_schema=0;`,
  );
  const patched = new SQL.Database(db.export());
  db.close();
  return patched;
}

export function parseApkg(data: Uint8Array, SQL: SqlJsStatic, fileName = "baralho.apkg",
  now = Date.now(), options: ParseOptions = {}): ParsedDeck {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data);
  } catch {
    throw Error("Este arquivo não parece ser um baralho do Anki (.apkg).");
  }
  const raw = files["collection.anki21b"]
    ? decompress(files["collection.anki21b"])
    : files["collection.anki21"] ?? files["collection.anki2"];
  if (!raw) throw Error("O arquivo não tem uma coleção do Anki dentro.");
  const db = open(SQL, raw);
  try {
    const modern = hasTable(db, "notetypes");
    const models = modern ? modernModels(db) : legacyModels(db);
    const decks = deckNames(db, modern);
    const conf = readConf(db, modern);
    const [crt] = rows(db, "select crt from col")[0];
    // O Anki guarda revisões em dias desde a criação da coleção.
    const ankiToday = Math.floor((now / 1000 - Number(crt)) / 86400);
    const today = dayNumber(now);
    let notes: ParsedNote[] = rows(db, "select id, mid, flds, tags from notes").map(
      ([id, mid, flds, tags]) => ({
        id: Number(id),
        model: Number(mid),
        fields: String(flds).split("\x1f"),
        tags: String(tags).trim().split(/\s+/).filter(Boolean),
      }),
    );
    if (
      notes.length === 1 &&
      notes[0].fields[0].startsWith("Please update to the latest Anki version")
    )
      throw Error("Este .apkg veio de uma versão do Anki que o site não lê.");
    let cards: ParsedCard[] = rows(
      db,
      `select id, nid, case when odid != 0 then odid else did end, ord, type, queue,
        case when odid != 0 then odue else due end, ivl, factor, reps, lapses, left
       from cards`,
    ).map(([id, nid, did, ord, type, queue, due, ivl, factor, reps, lapses, left]) => {
      const state = (["new", "learn", "review", "relearn"] as const)[Number(type)] ?? "new";
      const steps = state === "relearn" ? conf.relearnSteps : conf.learnSteps;
      let next = Number(due);
      if (state === "review") next = today + (Number(due) - ankiToday);
      else if (state !== "new")
        next = Number(queue) === 3
          ? now + (Number(due) - ankiToday) * 86_400_000
          : Number(due) * 1000;
      return {
        id: Number(id),
        note: Number(nid),
        ord: Number(ord),
        deck: decks.get(Number(did)) ?? "Sem baralho",
        state,
        due: next,
        ivl: Number(ivl),
        ease: Number(factor) ? Number(factor) / 1000 : conf.initialEase,
        step:
          state === "learn" || state === "relearn"
            ? Math.max(0, steps.length - (Number(left) % 1000))
            : 0,
        reps: Number(reps),
        lapses: Number(lapses),
        suspended: Number(queue) === -1,
      };
    });
    const media = readMedia(files);
    let skipped = 0;
    if (options.skipUnavailableImages) {
      const have = new Set(media.map((m) => m.name));
      const bad = new Set(
        notes
          .filter((n) => n.fields.some((f) => hasUnavailableImage(f, have)))
          .map((n) => n.id),
      );
      skipped = cards.filter((c) => bad.has(c.note)).length;
      cards = cards.filter((c) => !bad.has(c.note));
      notes = notes.filter((n) => !bad.has(n.id));
    }
    if (!cards.length)
      throw Error(
        skipped
          ? "Todos os cartões têm imagens que não vêm dentro do arquivo, então nenhum foi importado."
          : "O baralho não tem nenhum cartão.",
      );
    return {
      name: rootName(cards, fileName.replace(/\.apkg$/i, "")),
      models,
      conf,
      notes,
      cards,
      media,
      skipped,
    };
  } finally {
    db.close();
  }
}
