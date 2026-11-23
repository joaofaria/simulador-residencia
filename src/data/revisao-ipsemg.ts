import type { Area } from "../types";

// Revisão para a prova do IPSEMG: as 300 questões de 2024, 2025 e 2026
// classificadas por tema (à mão, lendo cada uma) e um cronograma de 9 dias em
// que cada turno de teoria tem um mini simulado com os temas daquele turno.

type Theme = { label: string; area: Area; questions: Record<number, number[]> };

export const themes = {
  // Cirurgia
  "cir-periop": {
    label: "Pré e pós-operatório e fundamentos",
    area: "cirurgia",
    questions: {
      2024: [3, 16],
      2025: [11],
      2026: [1, 2, 3, 4, 5, 7, 9, 11, 13, 14, 17, 18, 19, 20],
    },
  },
  "cir-trauma": {
    label: "Trauma",
    area: "cirurgia",
    questions: { 2024: [1, 2, 18, 19], 2025: [6], 2026: [6, 8, 10, 12, 15] },
  },
  "cir-abdome": {
    label: "Abdome agudo",
    area: "cirurgia",
    questions: { 2024: [5, 10], 2025: [3, 8, 9, 13, 15, 16, 17] },
  },
  "cir-biliar": {
    label: "Vias biliares",
    area: "cirurgia",
    questions: { 2024: [7, 12], 2025: [1, 7, 19] },
  },
  "cir-ulcera": {
    label: "Úlcera e hemorragia digestiva",
    area: "cirurgia",
    questions: { 2024: [6, 11], 2025: [4, 18, 20] },
  },
  "cir-onco": {
    label: "Oncologia do aparelho digestivo",
    area: "cirurgia",
    questions: { 2024: [14, 17], 2025: [10, 12, 14] },
  },
  "cir-hernia": {
    label: "Hérnias",
    area: "cirurgia",
    questions: { 2024: [9, 20], 2026: [16] },
  },
  "cir-vascular": {
    label: "Vascular",
    area: "cirurgia",
    questions: { 2024: [13], 2025: [2, 5] },
  },
  "cir-outros": {
    label: "Pâncreas, fígado e urologia",
    area: "cirurgia",
    questions: { 2024: [4, 8, 15] },
  },
  // Clínica médica
  "cm-cardio": {
    label: "Cardiologia",
    area: "clinica",
    questions: {
      2024: [30, 32, 34, 38],
      2025: [21, 23, 27, 32, 38],
      2026: [37, 39],
    },
  },
  "cm-nefro": {
    label: "Nefrologia e distúrbios eletrolíticos",
    area: "clinica",
    questions: { 2024: [33], 2025: [24, 31], 2026: [21, 23, 25, 27, 28, 35] },
  },
  "cm-figado": {
    label: "Fígado e aparelho digestivo",
    area: "clinica",
    questions: { 2024: [31, 40], 2025: [36, 40], 2026: [30, 32, 33, 38, 40] },
  },
  "cm-neuro": {
    label: "Neurologia, delirium e Wernicke",
    area: "clinica",
    questions: { 2024: [35, 37, 39], 2025: [33], 2026: [24, 36] },
  },
  "cm-pneumo": {
    label: "Pneumologia",
    area: "clinica",
    questions: { 2025: [26, 28, 29, 30, 34, 35] },
  },
  "cm-emergencia": {
    label: "Choque e intoxicações",
    area: "clinica",
    questions: { 2026: [22, 26, 29, 31, 34] },
  },
  "cm-hemato": {
    label: "Hematologia",
    area: "clinica",
    questions: { 2024: [21, 36] },
  },
  "cm-outros": {
    label: "Endocrinologia, reumatologia e infectologia",
    area: "clinica",
    questions: { 2024: [22, 27], 2025: [22, 25, 37, 39] },
  },
  "cm-mfc": {
    label: "Medicina de Família no bloco de Clínica",
    area: "clinica",
    questions: { 2024: [23, 24, 25, 26, 28, 29] },
  },
  // Ginecologia e obstetrícia
  "go-hipertensivas": {
    label: "Síndromes hipertensivas",
    area: "go",
    questions: { 2024: [48], 2025: [41, 45, 51, 53] },
  },
  "go-sangramento2": {
    label: "DPP e placenta prévia",
    area: "go",
    questions: { 2024: [42], 2025: [56, 58] },
  },
  "go-sangramento1": {
    label: "Abortamento e ectópica",
    area: "go",
    questions: { 2024: [45, 47] },
  },
  "go-infeccoes": {
    label: "Infecções na gestação",
    area: "go",
    questions: { 2024: [41], 2025: [50], 2026: [44] },
  },
  "go-dmg": {
    label: "Diabetes gestacional",
    area: "go",
    questions: { 2024: [49], 2025: [52] },
  },
  "go-parto": {
    label: "Parto e hemorragia pós-parto",
    area: "go",
    questions: { 2024: [43, 44, 50], 2025: [46] },
  },
  "go-obstetricia": {
    label: "Colestase, oligoidrâmnio e pré-natal",
    area: "go",
    questions: { 2025: [42, 43, 54] },
  },
  "go-colo": {
    label: "Colo do útero",
    area: "go",
    questions: { 2024: [56, 59], 2025: [57], 2026: [43, 55] },
  },
  "go-vulvovaginites": {
    label: "Vulvovaginites, IST e DIP",
    area: "go",
    questions: { 2024: [54, 58], 2025: [49, 59], 2026: [54, 58] },
  },
  "go-endocrino": {
    label: "SOP, amenorreia, ciclo e puberdade",
    area: "go",
    questions: { 2024: [57], 2025: [48], 2026: [42, 47, 49, 59] },
  },
  "go-sua": {
    label: "Sangramento uterino anormal",
    area: "go",
    questions: { 2024: [52, 53], 2025: [47], 2026: [46] },
  },
  "go-contracepcao": {
    label: "Contracepção",
    area: "go",
    questions: { 2024: [46, 55], 2026: [52, 57] },
  },
  "go-endometriose": {
    label: "Endometriose",
    area: "go",
    questions: { 2025: [44, 55], 2026: [45] },
  },
  "go-ovario": {
    label: "Tumores de ovário",
    area: "go",
    questions: { 2024: [51], 2026: [48, 53] },
  },
  "go-climaterio": {
    label: "Climatério",
    area: "go",
    questions: { 2025: [60], 2026: [51] },
  },
  "go-mama": { label: "Mama", area: "go", questions: { 2026: [41, 56] } },
  "go-incontinencia": {
    label: "Incontinência urinária",
    area: "go",
    questions: { 2024: [60], 2026: [50] },
  },
  "go-violencia": {
    label: "Violência sexual",
    area: "go",
    questions: { 2026: [60] },
  },
  // Preventiva
  "prev-niveis": {
    label: "Níveis de prevenção e prevenção quaternária",
    area: "preventiva",
    questions: { 2024: [62], 2025: [62, 63, 65, 80], 2026: [62, 67] },
  },
  "prev-estudos": {
    label: "Desenhos de estudo e medidas de associação",
    area: "preventiva",
    questions: { 2024: [68, 71], 2025: [64, 68, 71, 73], 2026: [68, 70] },
  },
  "prev-testes": {
    label: "Testes diagnósticos",
    area: "preventiva",
    questions: { 2024: [61, 64, 75, 76] },
  },
  "prev-indicadores": {
    label: "Indicadores e medidas de frequência",
    area: "preventiva",
    questions: { 2024: [69, 72, 77], 2025: [61, 66, 78], 2026: [69, 76] },
  },
  "prev-vigilancia": {
    label: "Vigilância e notificação",
    area: "preventiva",
    questions: { 2024: [66], 2025: [69, 75, 76, 79], 2026: [72, 73, 80] },
  },
  "prev-sus": {
    label: "SUS, legislação e gestão",
    area: "preventiva",
    questions: { 2024: [67, 70, 73, 74, 78], 2025: [74], 2026: [74, 77] },
  },
  "prev-promocao": {
    label: "Promoção da saúde",
    area: "preventiva",
    questions: { 2025: [67, 70, 77], 2026: [63, 75, 79] },
  },
  "prev-aps": {
    label: "Atenção Primária e saúde mental",
    area: "preventiva",
    questions: { 2024: [63, 65, 80], 2026: [65, 66, 71] },
  },
  "prev-outros": {
    label: "Óbito, trabalhador, tuberculose, bioética e rastreio",
    area: "preventiva",
    questions: { 2024: [79], 2025: [72], 2026: [61, 64, 78] },
  },
  // Pediatria
  "ped-puericultura": {
    label: "Puericultura e nutrição",
    area: "pediatria",
    questions: {
      2024: [85, 87, 88, 90, 99],
      2025: [81, 91, 97, 98],
      2026: [88, 95],
    },
  },
  "ped-neonatologia": {
    label: "Neonatologia",
    area: "pediatria",
    questions: { 2024: [81, 89, 95, 98], 2025: [82, 85, 96], 2026: [91, 96] },
  },
  "ped-imunizacao": {
    label: "Imunização",
    area: "pediatria",
    questions: { 2024: [97, 100], 2025: [88, 94] },
  },
  "ped-infecto": {
    label: "Infectologia",
    area: "pediatria",
    questions: { 2024: [91], 2025: [83, 90, 93, 100], 2026: [84, 92] },
  },
  "ped-respiratorio": {
    label: "Respiratório",
    area: "pediatria",
    questions: { 2024: [82], 2025: [86, 99], 2026: [100] },
  },
  "ped-cardio": {
    label: "Cardiologia",
    area: "pediatria",
    questions: { 2024: [86, 94], 2026: [86, 87] },
  },
  "ped-hemato": {
    label: "Hematologia e oncologia",
    area: "pediatria",
    questions: { 2024: [84, 93], 2025: [92], 2026: [83] },
  },
  "ped-nefro": {
    label: "Nefrologia, ITU e SHU",
    area: "pediatria",
    questions: { 2024: [92, 96], 2026: [85] },
  },
  "ped-endocrino": {
    label: "Endocrinologia",
    area: "pediatria",
    questions: { 2024: [83], 2026: [82, 94] },
  },
  "ped-gastro": {
    label: "Gastroenterologia",
    area: "pediatria",
    questions: { 2025: [84, 89], 2026: [98] },
  },
  "ped-neuro": {
    label: "Neurologia",
    area: "pediatria",
    questions: { 2025: [87], 2026: [81, 93] },
  },
  "ped-vasculites": {
    label: "Vasculites",
    area: "pediatria",
    questions: { 2025: [95], 2026: [99] },
  },
  "ped-outros": {
    label: "Ortopedia, imunodeficiência e trauma",
    area: "pediatria",
    questions: { 2026: [89, 90, 97] },
  },
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof themes;

export const questionId = (year: number, n: number) =>
  `ipsemg-${year}-q${String(n).padStart(3, "0")}`;

// Ano da prova completa usada como simulado em cada dia do cronograma.
export const fullExamDay: Record<number, number> = {
  2024: 1,
  2025: 5,
  2026: 9,
};

export type Shift = "manha" | "tarde" | "noite";
export const shiftLabels: Record<Shift, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export type Slot = {
  text: string;
  // Prova completa do IPSEMG daquele ano.
  full?: number;
  // Mini simulado com as questões do IPSEMG destes temas.
  themes?: ThemeId[];
  // Prova aleatória do banco inteiro numa área.
  random?: { area: Area; count: number };
  // Turno de correção ou revisão: leva ao histórico.
  review?: boolean;
};

export type Day = { day: number; slots: Record<Shift, Slot> };

export const plan: Day[] = [
  {
    day: 1,
    slots: {
      manha: {
        text: "Simulado IPSEMG 2024 completo, 100 questões, cronometrado",
        full: 2024,
      },
      tarde: {
        text: "Corrigir e anotar cada erro pelo tema",
        review: true,
      },
      noite: {
        text: "Preventiva: prevenção quaternária e níveis de Leavell e Clark",
        themes: ["prev-niveis"],
      },
    },
  },
  {
    day: 2,
    slots: {
      manha: {
        text: "Preventiva: desenhos de estudo, RR, OR, risco atribuível, intervalo de confiança, tabela 2x2 de testes diagnósticos",
        themes: ["prev-estudos", "prev-testes"],
      },
      tarde: {
        text: "Preventiva: indicadores, incidência, prevalência e letalidade com conta, Nelson de Moraes, notificação compulsória imediata",
        themes: ["prev-indicadores", "prev-vigilancia"],
      },
      noite: {
        text: "SUS (Leis 8.080 e 8.142, Decreto 7.508), controle social, APS, promoção da saúde, declaração de óbito, violência sexual. Prova aleatória de 30 questões de Preventiva",
        themes: [
          "prev-sus",
          "prev-aps",
          "prev-promocao",
          "prev-outros",
          "cm-mfc",
          "go-violencia",
        ],
        random: { area: "preventiva", count: 30 },
      },
    },
  },
  {
    day: 3,
    slots: {
      manha: {
        text: "Cirurgia: pré e pós-operatório (ASA, jejum ERAS, fios, incisões, drenos, laparoscopia, atelectasia, deiscência, estomas, NR-32), cicatrização e REMIT",
        themes: ["cir-periop"],
      },
      tarde: {
        text: "Cirurgia: trauma (ATLS, tipos de choque, tamponamento, hemotórax, retroperitônio, controle de danos, ácido tranexâmico, transfusão)",
        themes: ["cir-trauma"],
      },
      noite: {
        text: "Prova aleatória de 30 questões de Cirurgia",
        random: { area: "cirurgia", count: 30 },
      },
    },
  },
  {
    day: 4,
    slots: {
      manha: {
        text: "Cirurgia: abdome agudo, vias biliares com Tokyo, úlcera e HDA com Forrest e H. pylori, hérnias, aneurisma de aorta, câncer gástrico",
        themes: [
          "cir-abdome",
          "cir-biliar",
          "cir-ulcera",
          "cir-hernia",
          "cir-vascular",
          "cir-onco",
          "cir-outros",
        ],
      },
      tarde: {
        text: "Obstetrícia: síndromes hipertensivas e sulfato de magnésio, DPP contra placenta prévia, sífilis, diabetes gestacional, hemorragia pós-parto",
        themes: [
          "go-hipertensivas",
          "go-sangramento2",
          "go-infeccoes",
          "go-dmg",
        ],
      },
      noite: {
        text: "Obstetrícia: parto e Robson, abortamento, ectópica. Prova aleatória de 20 questões de GO",
        themes: ["go-parto", "go-sangramento1", "go-obstetricia"],
        random: { area: "go", count: 20 },
      },
    },
  },
  {
    day: 5,
    slots: {
      manha: {
        text: "Simulado IPSEMG 2025 completo, cronometrado",
        full: 2025,
      },
      tarde: { text: "Corrigir e anotar os erros por tema", review: true },
      noite: {
        text: "Ginecologia: vulvovaginites, IST e DIP, colo do útero (rastreio, colposcopia, conduta por laudo)",
        themes: ["go-vulvovaginites", "go-colo"],
      },
    },
  },
  {
    day: 6,
    slots: {
      manha: {
        text: "Ginecologia: amenorreia, SOP, ciclo menstrual, puberdade precoce, PALM-COEIN, contracepção pelos critérios da OMS, endometriose",
        themes: [
          "go-endocrino",
          "go-sua",
          "go-contracepcao",
          "go-endometriose",
        ],
      },
      tarde: {
        text: "Ginecologia: ovário, mama, climatério, incontinência urinária. Prova aleatória de 30 questões de GO",
        themes: ["go-ovario", "go-mama", "go-climaterio", "go-incontinencia"],
        random: { area: "go", count: 30 },
      },
      noite: {
        text: "Clínica: DPOC, pneumonia, câncer de pulmão, hematologia",
        themes: ["cm-pneumo", "cm-hemato", "cm-outros"],
      },
    },
  },
  {
    day: 7,
    slots: {
      manha: {
        text: "Pediatria: reanimação neonatal, coraçãozinho, icterícia, sepse neonatal, puericultura, aleitamento, ferro, desenvolvimento, calendário do PNI",
        themes: ["ped-neonatologia", "ped-puericultura", "ped-imunizacao"],
      },
      tarde: {
        text: "Pediatria: infectologia, respiratório, coarctação e febre reumática, anemias, SHU e ITU, endocrinologia, neurologia, vasculites",
        themes: [
          "ped-infecto",
          "ped-respiratorio",
          "ped-cardio",
          "ped-hemato",
          "ped-nefro",
          "ped-endocrino",
          "ped-gastro",
          "ped-neuro",
          "ped-vasculites",
          "ped-outros",
        ],
      },
      noite: {
        text: "Prova aleatória de 30 questões de Pediatria",
        random: { area: "pediatria", count: 30 },
      },
    },
  },
  {
    day: 8,
    slots: {
      manha: {
        text: "Clínica: insuficiência cardíaca, IAM, fibrilação atrial, endocardite, potássio, cálcio, lesão renal por AINE e contraste",
        themes: ["cm-cardio", "cm-nefro"],
      },
      tarde: {
        text: "Clínica: encefalopatia hepática, hepatites, King's College, delirium, Wernicke, choque e vasopressores, intoxicações",
        themes: ["cm-figado", "cm-neuro", "cm-emergencia"],
      },
      noite: {
        text: "Prova aleatória de 30 questões de Clínica",
        random: { area: "clinica", count: 30 },
      },
    },
  },
  {
    day: 9,
    slots: {
      manha: {
        text: "Simulado IPSEMG 2026 completo, cronometrado",
        full: 2026,
      },
      tarde: { text: "Corrigir e anotar os erros por tema", review: true },
      noite: {
        text: "Revisar os erros dos três simulados, tema por tema",
        review: true,
      },
    },
  },
];

// Teto de questões de um mini simulado; turnos com mais temas sorteiam.
export const miniLimit = 15;

export const miniId = (day: number, shift: Shift) => `revisao-d${day}-${shift}`;

// Questões do IPSEMG dos temas pedidos. Com `spare`, deixa de fora as provas
// cujo simulado completo ainda vem depois daquele dia, para não estragar o
// simulado com questões já vistas.
// Questões anuladas pela banca: ficam fora dos mini simulados, como na prova
// aleatória. O teste confere esta lista com o banco.
export const annulled: Record<number, number[]> = {
  2024: [10, 24, 74, 79, 100],
  2025: [18, 20, 30, 42, 50],
  2026: [1, 6, 11, 39, 40, 72, 77, 80],
};
const annulledIds = new Set(
  Object.entries(annulled).flatMap(([y, ns]) =>
    ns.map((n) => questionId(Number(y), n)),
  ),
);

export function themeQuestionIds(
  ids: ThemeId[],
  day: number,
  spare: boolean,
): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const t: Theme = themes[id];
    for (const [year, numbers] of Object.entries(t.questions)) {
      if (spare && fullExamDay[Number(year)] > day) continue;
      for (const n of numbers) {
        const q = questionId(Number(year), n);
        if (!annulledIds.has(q)) out.push(q);
      }
    }
  }
  return out;
}
