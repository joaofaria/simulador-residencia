/// <reference lib="webworker" />
import initSqlJs from "sql.js";
import wasm from "sql.js/dist/sql-wasm.wasm?url";
import { parseApkg } from "./apkg";
import { importDeck } from "./db";

// Ler um baralho grande (dezenas de MB) trava a página por alguns segundos,
// então a leitura e a gravação acontecem aqui, fora da tela.
export type WorkerMessage =
  | { kind: "progress"; stage: "reading" | "saving"; fraction: number }
  | { kind: "done"; id: string; name: string; cards: number }
  | { kind: "error"; message: string };

const post = (m: WorkerMessage) => self.postMessage(m);

self.onmessage = async (e: MessageEvent<File>) => {
  const file = e.data;
  try {
    post({ kind: "progress", stage: "reading", fraction: 0 });
    const SQL = await initSqlJs({ locateFile: () => wasm });
    const parsed = parseApkg(new Uint8Array(await file.arrayBuffer()), SQL, file.name);
    const col = await importDeck(parsed, file.name, (fraction) =>
      post({ kind: "progress", stage: "saving", fraction }),
    );
    post({ kind: "done", id: col.id, name: col.name, cards: col.cardCount });
  } catch (err) {
    post({
      kind: "error",
      message:
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível importar este arquivo.",
    });
  }
};
