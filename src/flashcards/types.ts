// Configuração de estudo de um baralho importado, nos mesmos termos do Anki.
// Passos em minutos, intervalos em dias.
export type Conf = {
  newPerDay: number;
  reviewsPerDay: number;
  learnSteps: number[];
  relearnSteps: number[];
  graduatingIvl: number;
  easyIvl: number;
  initialEase: number;
  easyBonus: number;
  hardFactor: number;
  ivlModifier: number;
  maxIvl: number;
  lapseMult: number;
  minLapseIvl: number;
};

export const defaultConf: Conf = {
  newPerDay: 20,
  reviewsPerDay: 200,
  learnSteps: [1, 10],
  relearnSteps: [10],
  graduatingIvl: 1,
  easyIvl: 4,
  initialEase: 2.5,
  easyBonus: 1.3,
  hardFactor: 1.2,
  ivlModifier: 1,
  maxIvl: 36500,
  lapseMult: 0,
  minLapseIvl: 1,
};

export type Model = {
  id: number;
  name: string;
  cloze: boolean;
  css: string;
  fields: string[];
  templates: { name: string; qfmt: string; afmt: string }[];
};

export type Note = {
  key: string;
  col: string;
  id: number;
  model: number;
  fields: string[];
  tags: string[];
};

export type CardState = "new" | "learn" | "review" | "relearn";

// `due` depende do estado: posição na fila (novo), instante em ms
// (aprendendo) ou número do dia (revisão).
export type Card = {
  key: string;
  col: string;
  id: number;
  note: number;
  ord: number;
  deck: string;
  state: CardState;
  due: number;
  ivl: number;
  ease: number;
  step: number;
  reps: number;
  lapses: number;
  suspended: boolean;
};

export type DayCount = { new: number; review: number };

export type Collection = {
  id: string;
  name: string;
  fileName: string;
  importedAt: string;
  models: Record<string, Model>;
  conf: Conf;
  cardCount: number;
  // Cartões vistos hoje por baralho, para os limites diários.
  today: { day: number; done: Record<string, DayCount> };
};

export const DECK_SEPARATOR = "::";
