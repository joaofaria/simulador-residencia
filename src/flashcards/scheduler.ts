import type { Card, Collection, Conf, DayCount } from "./types";
import { DECK_SEPARATOR } from "./types";

// Agendamento no estilo SM-2 do Anki (agendador v3, sem FSRS): passos de
// aprendizado em minutos, intervalos de revisão em dias, facilidade que sobe
// e desce com as respostas e limites diários por baralho.

export type Rating = 1 | 2 | 3 | 4;
export const ratingLabels: Record<Rating, string> = {
  1: "Errei",
  2: "Difícil",
  3: "Bom",
  4: "Fácil",
};

const MINUTE = 60_000;
const DAY = 86_400_000;
// O dia do Anki vira às 4h da manhã, não à meia-noite.
const ROLLOVER_HOURS = 4;
// Cartões em aprendizado que vencem nos próximos 20 minutos podem ser
// adiantados quando não sobra mais nada para hoje.
export const LEARN_AHEAD = 20 * MINUTE;

export function dayNumber(now: number, tzOffsetMinutes?: number) {
  const offset = tzOffsetMinutes ?? new Date(now).getTimezoneOffset();
  return Math.floor(
    (now - offset * MINUTE - ROLLOVER_HOURS * 3_600_000) / DAY,
  );
}

function clampEase(ease: number) {
  return Math.max(1.3, Math.round(ease * 1000) / 1000);
}

function capIvl(ivl: number, conf: Conf) {
  return Math.min(conf.maxIvl, Math.max(1, Math.round(ivl)));
}

// Atraso do botão "Difícil" num passo, como no Anki.
function hardDelay(steps: number[], step: number) {
  if (step === 0 && steps.length >= 2) return (steps[0] + steps[1]) / 2;
  if (steps.length === 1) return Math.min(steps[0] * 1.5, steps[0] + 1440);
  return steps[step];
}

function graduate(card: Card, ivl: number, today: number, conf: Conf): Card {
  return {
    ...card,
    state: "review",
    ivl: capIvl(ivl, conf),
    due: today + capIvl(ivl, conf),
    step: 0,
  };
}

function inSteps(card: Card, delay: number, step: number, now: number): Card {
  return {
    ...card,
    state: card.state === "new" ? "learn" : card.state,
    step,
    due: now + delay * MINUTE,
  };
}

// Intervalos de revisão para Difícil, Bom e Fácil, garantindo que um botão
// nunca agende antes do anterior.
function reviewIntervals(card: Card, today: number, conf: Conf) {
  const late = Math.max(0, today - card.due);
  const hard = Math.max(
    card.ivl * conf.hardFactor * conf.ivlModifier,
    conf.hardFactor > 1 ? card.ivl + 1 : 1,
  );
  const good = Math.max(
    (card.ivl + late / 2) * card.ease * conf.ivlModifier,
    Math.round(hard) + 1,
  );
  const easy = Math.max(
    (card.ivl + late) * card.ease * conf.easyBonus * conf.ivlModifier,
    Math.round(good) + 1,
  );
  return { hard: capIvl(hard, conf), good: capIvl(good, conf), easy: capIvl(easy, conf) };
}

export function answer(card: Card, rating: Rating, now: number, conf: Conf,
  today = dayNumber(now)): Card {
  const next = { ...card, reps: card.reps + 1 };
  if (card.state === "review") {
    if (rating === 1) {
      const ivl = Math.max(conf.minLapseIvl, Math.round(card.ivl * conf.lapseMult));
      const lapsed = {
        ...next,
        lapses: card.lapses + 1,
        ease: clampEase(card.ease - 0.2),
        ivl,
      };
      if (!conf.relearnSteps.length) return graduate(lapsed, ivl, today, conf);
      return { ...lapsed, state: "relearn", step: 0, due: now + conf.relearnSteps[0] * MINUTE };
    }
    const ivls = reviewIntervals(card, today, conf);
    if (rating === 2)
      return graduate({ ...next, ease: clampEase(card.ease - 0.15) }, ivls.hard, today, conf);
    if (rating === 3) return graduate(next, ivls.good, today, conf);
    return graduate({ ...next, ease: clampEase(card.ease + 0.15) }, ivls.easy, today, conf);
  }
  const relearning = card.state === "relearn";
  const steps = relearning ? conf.relearnSteps : conf.learnSteps;
  const base = card.state === "new" ? { ...next, ease: conf.initialEase } : next;
  const goodIvl = relearning ? card.ivl : conf.graduatingIvl;
  const easyIvl = relearning ? card.ivl + 1 : conf.easyIvl;
  const step = Math.min(card.step, Math.max(0, steps.length - 1));
  if (!steps.length)
    return graduate(base, rating === 4 ? easyIvl : goodIvl, today, conf);
  if (rating === 1) return inSteps(base, steps[0], 0, now);
  if (rating === 2) return inSteps(base, hardDelay(steps, step), step, now);
  if (rating === 3) {
    if (step + 1 < steps.length)
      return inSteps(base, steps[step + 1], step + 1, now);
    return graduate(base, goodIvl, today, conf);
  }
  return graduate(base, easyIvl, today, conf);
}

// Quanto tempo falta até o cartão voltar, como aparece em cima dos botões.
export function nextDelay(card: Card, rating: Rating, now: number, conf: Conf,
  today = dayNumber(now)) {
  const after = answer(card, rating, now, conf, today);
  return after.state === "review" ? (after.due - today) * DAY : after.due - now;
}

function fmt(n: number) {
  return (Math.round(n * 10) / 10).toLocaleString("pt-BR");
}

export function formatDelay(ms: number) {
  const minutes = ms / MINUTE;
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${fmt(hours)} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d`;
  if (days < 365) {
    const months = days / 30;
    return `${fmt(months)} ${months < 2 ? "mês" : "meses"}`;
  }
  const years = days / 365;
  return `${fmt(years)} ${years < 2 ? "ano" : "anos"}`;
}

// Árvore de baralhos a partir dos nomes "Pai::Filho::Neto" dos cartões.
export type DeckNode = {
  name: string;
  label: string;
  children: DeckNode[];
  cards: Card[];
};

export function deckTree(cards: Card[]): DeckNode[] {
  const roots: DeckNode[] = [];
  const index = new Map<string, DeckNode>();
  function node(name: string): DeckNode {
    let n = index.get(name);
    if (n) return n;
    const parts = name.split(DECK_SEPARATOR);
    n = { name, label: parts.at(-1)!, children: [], cards: [] };
    index.set(name, n);
    if (parts.length === 1) roots.push(n);
    else node(parts.slice(0, -1).join(DECK_SEPARATOR)).children.push(n);
    return n;
  }
  for (const c of cards) node(c.deck).cards.push(c);
  const sort = (list: DeckNode[]) => {
    list.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

export function findDeck(roots: DeckNode[], name: string): DeckNode | undefined {
  for (const n of roots) {
    if (n.name === name) return n;
    if (name.startsWith(n.name + DECK_SEPARATOR)) return findDeck(n.children, name);
  }
}

export function ancestors(deck: string) {
  const parts = deck.split(DECK_SEPARATOR);
  return parts.map((_, i) => parts.slice(0, i + 1).join(DECK_SEPARATOR));
}

export function todayCounts(col: Collection, today: number) {
  return col.today.day === today ? col.today.done : {};
}

function remaining(done: Record<string, DayCount>, deck: string, kind: keyof DayCount,
  perDay: number) {
  return Math.max(0, perDay - (done[deck]?.[kind] ?? 0));
}

// Junta os cartões do baralho e dos subbaralhos respeitando o limite de cada
// um, na ordem dos baralhos, como o Anki faz.
function gather(node: DeckNode, cap: number, pick: (c: Card) => boolean,
  limitOf: (deck: string) => number, order: (a: Card, b: Card) => number): Card[] {
  const limit = Math.min(cap, limitOf(node.name));
  if (limit <= 0) return [];
  const out = node.cards.filter(pick).sort(order).slice(0, limit);
  for (const child of node.children) {
    if (out.length >= limit) break;
    out.push(...gather(child, limit - out.length, pick, limitOf, order));
  }
  return out;
}

export type Queue = { learn: Card[]; review: Card[]; fresh: Card[]; later: Card[] };

export function buildQueue(node: DeckNode, col: Collection, now: number,
  today = dayNumber(now)): Queue {
  const done = todayCounts(col, today);
  const all: Card[] = [];
  const walk = (n: DeckNode) => {
    all.push(...n.cards);
    n.children.forEach(walk);
  };
  walk(node);
  const active = all.filter((c) => !c.suspended);
  const learning = active
    .filter((c) => c.state === "learn" || c.state === "relearn")
    .sort((a, b) => a.due - b.due);
  const endOfDay = (today + 1) * DAY + ROLLOVER_HOURS * 3_600_000 +
    new Date(now).getTimezoneOffset() * MINUTE;
  const review = gather(node, Infinity,
    (c) => !c.suspended && c.state === "review" && c.due <= today,
    (d) => remaining(done, d, "review", col.conf.reviewsPerDay),
    (a, b) => a.due - b.due || a.id - b.id).sort((a, b) => a.due - b.due || a.id - b.id);
  const fresh = gather(node, Infinity, (c) => !c.suspended && c.state === "new",
    (d) => remaining(done, d, "new", col.conf.newPerDay),
    (a, b) => a.due - b.due || a.id - b.id);
  return {
    learn: learning.filter((c) => c.due <= now + LEARN_AHEAD),
    later: learning.filter((c) => c.due > now + LEARN_AHEAD && c.due < endOfDay),
    review,
    fresh,
  };
}

export function counts(q: Queue) {
  return { fresh: q.fresh.length, learn: q.learn.length, review: q.review.length };
}

// Próximo cartão: aprendizado vencido primeiro, depois revisões e novos
// intercalados, e por fim aprendizado adiantado.
export function nextCard(q: Queue, now: number, shown: { fresh: number; review: number }) {
  const due = q.learn.find((c) => c.due <= now);
  if (due) return due;
  if (q.review.length && q.fresh.length) {
    const takeNew = shown.fresh * (q.review.length + shown.review) <=
      shown.review * (q.fresh.length + shown.fresh);
    return takeNew ? q.fresh[0] : q.review[0];
  }
  return q.review[0] ?? q.fresh[0] ?? q.learn[0];
}

export function recordAnswer(col: Collection, before: Card, today: number): Collection {
  const done = { ...todayCounts(col, today) };
  const kind: keyof DayCount | undefined = before.state === "new"
    ? "new" : before.state === "review" ? "review" : undefined;
  if (kind)
    for (const d of ancestors(before.deck)) {
      const prev = done[d] ?? { new: 0, review: 0 };
      done[d] = { ...prev, [kind]: prev[kind] + 1 };
    }
  return { ...col, today: { day: today, done } };
}
