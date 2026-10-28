import type { Model } from "./types";
import { DECK_SEPARATOR } from "./types";

// Monta a frente e o verso de um cartão a partir dos modelos do Anki:
// campos {{Campo}}, seções {{#Campo}}...{{/Campo}} e {{^Campo}}, {{FrontSide}}
// e os filtros mais usados (cloze, text, hint, type).

type Node =
  | { kind: "text"; value: string }
  | { kind: "field"; name: string }
  | { kind: "section"; name: string; negated: boolean; children: Node[] };

function parse(fmt: string): Node[] {
  const root: Node[] = [];
  const stack: { name: string; children: Node[] }[] = [{ name: "", children: root }];
  const re = /\{\{([\s\S]*?)\}\}/g;
  let last = 0;
  for (let m = re.exec(fmt); m; m = re.exec(fmt)) {
    const top = stack.at(-1)!;
    if (m.index > last) top.children.push({ kind: "text", value: fmt.slice(last, m.index) });
    last = re.lastIndex;
    const tag = m[1].trim();
    if (tag.startsWith("#") || tag.startsWith("^")) {
      const section: Node = {
        kind: "section",
        name: tag.slice(1).trim(),
        negated: tag[0] === "^",
        children: [],
      };
      top.children.push(section);
      stack.push({ name: section.name, children: section.children });
    } else if (tag.startsWith("/")) {
      if (stack.length > 1) stack.pop();
    } else if (tag && !tag.startsWith("!")) top.children.push({ kind: "field", name: tag });
  }
  if (last < fmt.length) stack.at(-1)!.children.push({ kind: "text", value: fmt.slice(last) });
  return root;
}

export function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([^}]*?))?\}\}/g;

export function renderCloze(text: string, ord: number, side: "q" | "a") {
  return text.replace(CLOZE, (_, n: string, content: string, hint?: string) => {
    if (Number(n) !== ord + 1) return content;
    if (side === "a") return `<span class="cloze">${content}</span>`;
    return `<span class="cloze">[${hint ?? "..."}]</span>`;
  });
}

export type RenderContext = {
  model: Model;
  fields: string[];
  tags: string[];
  deck: string;
  ord: number;
  side: "q" | "a";
  frontSide?: string;
};

function special(name: string, ctx: RenderContext): string | undefined {
  switch (name) {
    case "FrontSide":
      return ctx.frontSide ?? "";
    case "Tags":
      return ctx.tags.join(" ");
    case "Deck":
      return ctx.deck;
    case "Subdeck":
      return ctx.deck.split(DECK_SEPARATOR).at(-1);
    case "Type":
      return ctx.model.name;
    case "Card":
      return ctx.model.cloze
        ? `Cloze ${ctx.ord + 1}`
        : ctx.model.templates[ctx.ord]?.name ?? "";
  }
}

function fieldValue(tag: string, ctx: RenderContext) {
  const parts = tag.split(":");
  const name = parts.pop()!.trim();
  let value = special(name, ctx);
  if (value === undefined) {
    const i = ctx.model.fields.indexOf(name);
    value = i >= 0 ? (ctx.fields[i] ?? "") : "";
  }
  // Os filtros valem da direita para a esquerda, como no Anki.
  for (const filter of parts.reverse().map((f) => f.trim())) {
    if (filter === "cloze") value = renderCloze(value, ctx.ord, ctx.side);
    else if (filter === "text") value = stripHtml(value);
    else if (filter === "hint")
      value = value ? `<details class="hint"><summary>Dica</summary>${value}</details>` : "";
    else if (filter === "type") value = ctx.side === "a" ? value : "";
    else if (filter.startsWith("tts")) value = "";
    else if (filter === "kana" || filter === "kanji" || filter === "furigana")
      value = value.replace(/\[[^\]]*\]/g, "");
  }
  return value;
}

function nonEmpty(name: string, ctx: RenderContext) {
  const i = ctx.model.fields.indexOf(name);
  const value = i >= 0 ? ctx.fields[i] ?? "" : special(name, ctx) ?? "";
  return stripHtml(value) !== "" || /<img/i.test(value);
}

function renderNodes(nodes: Node[], ctx: RenderContext): string {
  return nodes
    .map((n) => {
      if (n.kind === "text") return n.value;
      if (n.kind === "field") return fieldValue(n.name, ctx);
      return nonEmpty(n.name, ctx) !== n.negated ? renderNodes(n.children, ctx) : "";
    })
    .join("");
}

// Sons e marcações de leitura em voz alta não têm como tocar aqui.
function cleanup(html: string) {
  return html
    .replace(/\[sound:[^\]]*\]/g, "")
    .replace(/\[anki:tts[^\]]*\][\s\S]*?\[\/anki:tts\]/g, "");
}

export function renderCard(model: Model, fields: string[], tags: string[], deck: string,
  ord: number) {
  const template = model.cloze ? model.templates[0] : model.templates[ord];
  if (!template) return { question: "", answer: "" };
  const base = { model, fields, tags, deck, ord };
  const question = cleanup(renderNodes(parse(template.qfmt), { ...base, side: "q" }));
  const answer = cleanup(
    renderNodes(parse(template.afmt), { ...base, side: "a", frontSide: question }),
  );
  return { question, answer };
}
