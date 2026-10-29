import { loadRealExams } from "../data/load";
import { areaLabels, type Exam, type Question } from "../types";
import {
  getCollection,
  loadCards,
  saveCollection,
  saveNotesAndCards,
} from "./db";
import { dayNumber } from "./scheduler";
import { defaultConf, type Card, type Collection, type Model, type Note } from "./types";

// Cards feitos com as questões do banco do simulador: a frente é só o
// enunciado (sem as alternativas), o verso traz a resposta certa e a fonte. Ficam numa coleção
// própria, no mesmo IndexedDB e com o mesmo agendamento dos baralhos importados.

export const OFFICIAL_ID = "provas-oficiais";
export const OFFICIAL_NAME = "Provas oficiais";

const model: Model = {
  id: 1,
  name: "Questão de prova",
  cloze: false,
  css: `.card { text-align: left; }
.card p { margin: 0 0 12px; }
.question-table th, .question-table td { border: 1px solid var(--border, #dae4f2); padding: 4px 8px; }
.reference { color: var(--muted, #586a85); font-size: 14px; margin-top: 14px; }`,
  fields: ["Enunciado", "Resposta", "Fonte"],
  templates: [
    {
      name: "Cartão 1",
      qfmt: "{{Enunciado}}",
      afmt: '{{FrontSide}}<hr id=answer>{{Resposta}}<div class="reference">{{Fonte}}</div>',
    },
  ],
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paragraph = (text: string) =>
  `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;

function tableHtml(table: NonNullable<Question["tables"]>[number]) {
  const head = table.header.map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join("");
  const body = table.rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="question-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// {{figura}} no enunciado marca onde entram tabelas e figuras; sem a marca,
// elas ficam logo depois do texto (mesma regra da tela do simulado).
export function statementHtml(q: Question, base: string) {
  const [before, after = ""] = q.statement.split(/\n\{\{figura\}\}\n?/);
  const media =
    (q.tables ?? []).map(tableHtml).join("") +
    q.images
      .map((i) => `<p><img src="${escapeHtml(base + i.src)}" alt="${escapeHtml(i.alt)}"></p>`)
      .join("");
  return (before ? paragraph(before) : "") + media + (after ? paragraph(after) : "");
}

// Coleções geradas com um layout antigo de cartão precisam ser regeneradas.
export function isOutdated(col: Collection) {
  return col.models[model.id]?.fields.join() !== model.fields.join();
}

// Só entram questões com gabarito: anuladas e pendentes não têm resposta certa.
export function isCardable(q: Question) {
  return q.review === "approved" && q.key.status === "verified";
}

function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function buildOfficial(exams: Exam[], base: string) {
  const notes: Omit<Note, "key" | "col">[] = [];
  const cards: Omit<Card, "key" | "col">[] = [];
  const used = new Set<number>();
  let position = 0;
  for (const exam of exams) {
    if (exam.demo || exam.random) continue;
    for (const q of [...exam.questions].sort((a, b) => a.number - b.number)) {
      if (!isCardable(q) || q.key.status !== "verified") continue;
      // O id vem do código da questão, então não muda se o banco crescer.
      let id = hash(q.id);
      while (used.has(id)) id++;
      used.add(id);
      const right = q.key.answer;
      const alt = q.alternatives.find((a) => a.letter === right);
      const unofficial =
        q.key.basis === "third-party" || exam.keySource?.type === "third-party";
      const deck = `${OFFICIAL_NAME}::${areaLabels[q.area ?? "clinica"]}::${exam.institution} ${exam.year}`;
      notes.push({
        id,
        model: model.id,
        tags: [],
        fields: [
          statementHtml(q, base),
          `<p>${escapeHtml(alt?.text ?? right)}</p>`,
          escapeHtml(
            `${exam.institution} ${exam.year}, questão ${q.number}` +
              (unofficial ? ". Gabarito de outra fonte, sem o documento oficial da banca." : ""),
          ),
        ],
      });
      cards.push({
        id,
        note: id,
        ord: 0,
        deck,
        state: "new",
        due: position++,
        ivl: 0,
        ease: defaultConf.initialEase,
        step: 0,
        reps: 0,
        lapses: 0,
        suspended: false,
      });
    }
  }
  return { notes, cards };
}

// Cria a coleção ou acrescenta as questões que entraram no banco depois.
// O texto das notas é sempre regravado; o progresso dos cartões existentes
// nunca é tocado.
export async function syncOfficial(now = Date.now(),
  exams?: Exam[]): Promise<{ added: number; total: number }> {
  const built = buildOfficial(exams ?? (await loadRealExams()), import.meta.env.BASE_URL);
  const existing = await getCollection(OFFICIAL_ID);
  const have = new Set(existing ? (await loadCards(OFFICIAL_ID)).map((c) => c.id) : []);
  const fresh = built.cards.filter((c) => !have.has(c.id));
  await saveNotesAndCards(
    built.notes.map((n) => ({ ...n, key: `${OFFICIAL_ID}:${n.id}`, col: OFFICIAL_ID })),
    fresh.map((c) => ({ ...c, key: `${OFFICIAL_ID}:${c.id}`, col: OFFICIAL_ID })),
  );
  const col: Collection = existing
    ? { ...existing, models: { [model.id]: model }, cardCount: have.size + fresh.length }
    : {
        id: OFFICIAL_ID,
        name: OFFICIAL_NAME,
        fileName: "",
        source: "provas",
        importedAt: new Date(now).toISOString(),
        models: { [model.id]: model },
        conf: defaultConf,
        cardCount: fresh.length,
        today: { day: dayNumber(now), done: {} },
      };
  await saveCollection(col);
  return { added: fresh.length, total: col.cardCount };
}
