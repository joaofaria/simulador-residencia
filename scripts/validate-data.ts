import { existsSync } from "node:fs";
import { exams as catalog } from "../src/data/catalog";
import { examSchema } from "../src/types";
const exams = examSchema.array().parse(catalog.filter((e) => !e.demo));
const ids = new Set<string>();
for (const exam of exams) {
  const numbers = new Set<number>();
  if (exam.pdf && !existsSync(`public/${exam.pdf}`))
    throw Error(`PDF ausente: ${exam.id}`);
  for (const q of exam.questions) {
    if (ids.has(q.id) || numbers.has(q.number))
      throw Error(`Duplicata: ${q.id}`);
    ids.add(q.id);
    numbers.add(q.number);
    if (q.institution !== exam.institution || q.year !== exam.year)
      throw Error(`Origem inconsistente: ${q.id}`);
    const letters = q.alternatives.map((a) => a.letter);
    if (new Set(letters).size !== letters.length)
      throw Error(`Alternativas duplicadas: ${q.id}`);
    if (q.key.status === "verified" && !letters.includes(q.key.answer))
      throw Error(`Gabarito inválido: ${q.id}`);
    if (!exam.demo && (!q.source.pdf || !q.source.pages.length))
      throw Error(`Fonte ausente: ${q.id}`);
    for (const image of [...q.images, ...(q.originalPages ?? [])])
      if (!existsSync(`public/${image.src}`))
        throw Error(`Imagem ausente: ${q.id}, ${image.src}`);
    if (
      q.key.status !== "pending" &&
      q.key.basis === "user-validated-pdf" &&
      !q.originalPages?.length
    )
      throw Error(`Documento validado sem recorte original: ${q.id}`);
    if (!q.area) throw Error(`Área ausente: ${q.id}`);
    if (q.review === "required")
      throw Error(`Não publique transcrição sem revisão: ${q.id}`);
  }
}
const perArea = new Map<string, number>();
for (const q of exams.flatMap((e) => e.questions))
  perArea.set(q.area!, (perArea.get(q.area!) ?? 0) + 1);
console.log(
  [...perArea].map(([area, n]) => `${area}: ${n}`).join(", "),
);
console.log(
  `${exams.length} provas, ${ids.size} questões; conteúdo e arquivos estruturais validados.`,
);
