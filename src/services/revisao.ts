// Marcas do cronograma do IPSEMG guardadas neste navegador.
//
// Cada tópico guarda se está marcado e quando isso mudou, para que dois
// navegadores possam juntar as marcas: vale a mudança mais recente de cada
// tópico. Marcas antigas, de antes da conta, entram com data zero.

export const SPARE_KEY = "residencia.revisao.guardar";
export const DONE_KEY = "residencia.revisao.revisados";
export const MARKS_KEY = "residencia.revisao.marcas";
export const CHANGED_EVENT = "residencia:revisao";

export type Mark = { on: boolean; at: number };
// Tópicos pela chave dia:tarefa:texto; "guardar" é a opção de reservar as
// provas dos simulados completos.
export type Marks = Record<string, Mark>;
export const SPARE_MARK = "guardar";

function parse(raw: string | null): unknown {
  try {
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function isMarks(value: unknown): value is Marks {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as Mark).on === "boolean" &&
        typeof (m as Mark).at === "number",
    )
  );
}

export function readMarks(): Marks {
  let marks: Marks = {};
  try {
    const saved = parse(localStorage.getItem(MARKS_KEY));
    if (isMarks(saved)) marks = { ...saved };
    // Formato anterior: lista de tópicos marcados e "sim"/"nao".
    const done = parse(localStorage.getItem(DONE_KEY));
    if (Array.isArray(done))
      for (const key of done.map(String))
        marks[key] ??= { on: true, at: 0 };
    marks[SPARE_MARK] ??= {
      on: localStorage.getItem(SPARE_KEY) === "sim",
      at: 0,
    };
  } catch {
    /* Sem armazenamento, tudo começa desmarcado. */
  }
  return marks;
}

export function writeMarks(marks: Marks) {
  try {
    localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
    // O formato antigo continua atualizado, para quem voltar a uma versão
    // anterior do site não perder as marcas.
    localStorage.setItem(
      DONE_KEY,
      JSON.stringify(
        Object.entries(marks)
          .filter(([k, m]) => k !== SPARE_MARK && m.on)
          .map(([k]) => k),
      ),
    );
    localStorage.setItem(SPARE_KEY, marks[SPARE_MARK]?.on ? "sim" : "nao");
  } catch {
    /* As marcas valem só nesta visita. */
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function setMark(key: string, on: boolean, now = Date.now()) {
  const marks = readMarks();
  // A data nunca anda para trás, mesmo com o relógio do aparelho atrasado.
  const at = Math.max(now, (marks[key]?.at ?? 0) + 1);
  writeMarks({ ...marks, [key]: { on, at } });
}

// Junta as marcas de dois lugares: em cada tópico vale a mudança mais
// recente; num empate, marcado ganha, para nada feito se perder.
export function mergeMarks(a: Marks, b: Marks): Marks {
  const out: Marks = { ...a };
  for (const [key, m] of Object.entries(b)) {
    const mine = out[key];
    if (!mine || m.at > mine.at || (m.at === mine.at && m.on && !mine.on))
      out[key] = m;
  }
  return out;
}

export function sameMarks(a: Marks, b: Marks) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys)
    if (a[k]?.on !== b[k]?.on || a[k]?.at !== b[k]?.at) return false;
  return true;
}

// Para a sincronização saber se há algo novo: a mudança mais recente.
export function marksProgress(marks: Marks) {
  return Object.values(marks).reduce((max, m) => Math.max(max, m.at), 0);
}
