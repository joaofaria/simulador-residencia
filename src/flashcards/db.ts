import type { ParsedDeck } from "./apkg";
import { dayNumber } from "./scheduler";
import type { Card, Collection, Note } from "./types";

// Os baralhos ficam no IndexedDB deste navegador. O localStorage, onde fica o
// histórico dos simulados, não comporta dezenas de megabytes.

const DB_NAME = "residencao-flashcards";
const VERSION = 1;

let opening: Promise<IDBDatabase> | undefined;

export function openDb(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("collections", { keyPath: "id" });
      db.createObjectStore("notes", { keyPath: "key" });
      db.createObjectStore("cards", { keyPath: "key" }).createIndex("col", "col");
      db.createObjectStore("media", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      opening = undefined;
      reject(req.error ?? Error("Não foi possível abrir o banco do navegador."));
    };
  });
  return opening;
}

// Só para os testes recomeçarem com o banco vazio.
export async function closeDb() {
  if (opening) (await opening).close();
  opening = undefined;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? Error("O navegador cancelou a gravação. O espaço pode ter acabado."));
  });
}

const prefix = (col: string) => IDBKeyRange.bound(`${col}:`, `${col}:￿`);

export async function listCollections(): Promise<Collection[]> {
  const db = await openDb();
  const all = await request(
    db.transaction("collections").objectStore("collections").getAll(),
  );
  return (all as Collection[]).sort((a, b) => a.importedAt.localeCompare(b.importedAt));
}

export async function getCollection(id: string): Promise<Collection | undefined> {
  const db = await openDb();
  return request(db.transaction("collections").objectStore("collections").get(id));
}

export async function loadCards(col: string): Promise<Card[]> {
  const db = await openDb();
  return request(
    db.transaction("cards").objectStore("cards").index("col").getAll(col),
  );
}

export async function loadNote(col: string, id: number): Promise<Note | undefined> {
  const db = await openDb();
  return request(db.transaction("notes").objectStore("notes").get(`${col}:${id}`));
}

export async function loadMedia(col: string, name: string): Promise<Blob | undefined> {
  const db = await openDb();
  const row = await request(
    db.transaction("media").objectStore("media").get(`${col}:${name}`),
  );
  return (row as { blob: Blob } | undefined)?.blob;
}

// Grava a resposta: o cartão e os contadores do dia, juntos.
export async function saveAnswer(col: Collection, card: Card) {
  const db = await openDb();
  const tx = db.transaction(["collections", "cards"], "readwrite");
  tx.objectStore("collections").put(col);
  tx.objectStore("cards").put(card);
  await done(tx);
}

export async function saveCollection(col: Collection) {
  const db = await openDb();
  const tx = db.transaction("collections", "readwrite");
  tx.objectStore("collections").put(col);
  await done(tx);
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
};

const CHUNK = 2000;

export async function importDeck(parsed: ParsedDeck, fileName: string,
  progress: (fraction: number) => void = () => {}, now = Date.now()): Promise<Collection> {
  const db = await openDb();
  const id = `c${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const col: Collection = {
    id,
    name: parsed.name,
    fileName,
    importedAt: new Date(now).toISOString(),
    models: parsed.models,
    conf: parsed.conf,
    cardCount: parsed.cards.length,
    today: { day: dayNumber(now), done: {} },
  };
  const total = parsed.notes.length + parsed.cards.length + parsed.media.length;
  let written = 0;
  try {
    // Em partes, para a tela mostrar o andamento e não travar.
    for (let i = 0; i < parsed.notes.length; i += CHUNK) {
      const tx = db.transaction("notes", "readwrite");
      const store = tx.objectStore("notes");
      for (const n of parsed.notes.slice(i, i + CHUNK))
        store.put({ ...n, key: `${id}:${n.id}`, col: id });
      await done(tx);
      written += Math.min(CHUNK, parsed.notes.length - i);
      progress(written / total);
    }
    for (let i = 0; i < parsed.cards.length; i += CHUNK) {
      const tx = db.transaction("cards", "readwrite");
      const store = tx.objectStore("cards");
      for (const c of parsed.cards.slice(i, i + CHUNK))
        store.put({ ...c, key: `${id}:${c.id}`, col: id });
      await done(tx);
      written += Math.min(CHUNK, parsed.cards.length - i);
      progress(written / total);
    }
    if (parsed.media.length) {
      const tx = db.transaction("media", "readwrite");
      const store = tx.objectStore("media");
      for (const m of parsed.media) {
        const ext = m.name.split(".").pop()?.toLowerCase() ?? "";
        store.put({
          key: `${id}:${m.name}`,
          col: id,
          blob: new Blob([m.data as BlobPart], { type: MIME[ext] ?? "" }),
        });
      }
      await done(tx);
    }
    // A coleção entra por último: se algo falhar antes, ela não aparece pela metade.
    await saveCollection(col);
    progress(1);
    return col;
  } catch (e) {
    await deleteCollection(id).catch(() => {});
    throw e;
  }
}

export async function deleteCollection(id: string) {
  const db = await openDb();
  const tx = db.transaction(["collections", "notes", "cards", "media"], "readwrite");
  tx.objectStore("collections").delete(id);
  tx.objectStore("notes").delete(prefix(id));
  tx.objectStore("cards").delete(prefix(id));
  tx.objectStore("media").delete(prefix(id));
  await done(tx);
}
