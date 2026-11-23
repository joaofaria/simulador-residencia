import type { Area } from "../types";

// Revisão para a prova do IPSEMG: as 300 questões de 2024, 2025 e 2026
// classificadas por tema (à mão, lendo cada uma) e um cronograma de 9 dias em
// que cada tarefa de estudo lista os tópicos e termina num mini simulado.

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

export type Task = {
  title: string;
  // Tópicos que caíram nas provas de 2024 a 2026.
  caiu?: string[];
  // Tópicos vizinhos que não caíram, mas completam o assunto.
  completar?: string[];
  // Prova completa do IPSEMG daquele ano.
  full?: number;
  // Mini simulado com as questões do IPSEMG destes temas.
  themes?: ThemeId[];
  // Prova aleatória do banco inteiro numa área.
  random?: { area: Area; count: number };
  // Correção ou revisão: leva ao histórico.
  review?: boolean;
};

export type Day = { day: number; tasks: Task[] };

const simulado = (year: number): Task => ({
  title: `Simulado IPSEMG ${year} completo, 100 questões, cronometrado`,
  full: year,
});
const correcao: Task = {
  title: "Correção do simulado: anotar cada erro pelo tópico",
  review: true,
};
const aleatoria = (area: Area, label: string, count = 30): Task => ({
  title: `Prova aleatória de ${count} questões de ${label}`,
  random: { area, count },
});

export const plan: Day[] = [
  {
    day: 1,
    tasks: [
      simulado(2024),
      correcao,
      {
        title: "Preventiva: níveis de prevenção",
        caiu: [
          "Níveis de Leavell e Clark e em qual nível entra cada ação (cessar tabagismo no doente, rastreio, vacina)",
          "Prevenção quaternária: check-up sem indicação, PSA e teste ergométrico em assintomático, medicação por medo da doença",
          "Promoção da saúde nas doenças crônicas no período pré-patogênico",
        ],
        completar: [
          "História natural da doença",
          "Sobrediagnóstico e sobretratamento",
        ],
        themes: ["prev-niveis"],
      },
    ],
  },
  {
    day: 2,
    tasks: [
      {
        title: "Preventiva: desenhos de estudo e testes diagnósticos",
        caiu: [
          "Caso-controle para doença rara e de latência longa (agrotóxico e câncer, duas vezes)",
          "Coorte contra caso-controle, viés de memória",
          "Ensaio clínico randomizado",
          "Risco relativo contra odds ratio, risco atribuível",
          "Leitura de RR com intervalo de confiança de 95%",
          "Sensibilidade, especificidade, valores preditivos e acurácia, montando a tabela 2x2",
          "Qual teste escolher para triagem e qual para confirmar",
        ],
        completar: [
          "Estudo transversal e ecológico",
          "NNT",
          "Vieses de seleção e confusão",
        ],
        themes: ["prev-estudos", "prev-testes"],
      },
      {
        title: "Preventiva: indicadores e vigilância",
        caiu: [
          "Cálculo de incidência, prevalência, mortalidade e letalidade",
          "Densidade de incidência",
          "Mortalidade infantil proporcional e curva de Nelson de Moraes",
          "Endemia e cobertura vacinal",
          "Notificação compulsória imediata (cólera, botulismo, febre amarela e outras)",
          "Quarentena e vacinação de bloqueio",
          "Curva epidêmica de fonte comum e LIRAa",
        ],
        completar: [
          "Epidemia e surto",
          "Isolamento contra quarentena",
          "Lista nacional de notificação semanal",
        ],
        themes: ["prev-indicadores", "prev-vigilancia"],
      },
      {
        title: "Preventiva: SUS, Atenção Primária e saúde coletiva",
        caiu: [
          "Princípios do SUS, com integralidade",
          "Conselhos e conferências de saúde (Lei 8.142)",
          "Decreto 7.508",
          "Previne Brasil e custo-efetividade",
          "Atributos da APS: longitudinalidade e matriciamento",
          "RAPS e tipos de CAPS",
          "Carta de Ottawa, Relatório Lalonde, modelo de Dahlgren e Whitehead",
          "Ciclo de vida familiar, ecomapa, método clínico centrado na pessoa",
          "Declaração de óbito: causa básica e sequência",
          "Violência sexual: levonorgestrel e profilaxias",
          "Saúde do trabalhador: silicose e LER/DORT",
          "Cuidados paliativos e bioética (distanásia, justiça)",
          "Tratamento diretamente observado na tuberculose",
        ],
        completar: [
          "Lei 8.080 inteira",
          "Educação permanente em saúde",
          "Planejamento estratégico situacional",
        ],
        themes: [
          "prev-sus",
          "prev-aps",
          "prev-promocao",
          "prev-outros",
          "cm-mfc",
          "go-violencia",
        ],
      },
      aleatoria("preventiva", "Preventiva"),
    ],
  },
  {
    day: 3,
    tasks: [
      {
        title: "Cirurgia: pré e pós-operatório",
        caiu: [
          "Classificação ASA",
          "Jejum abreviado do ERAS e ACERTO (líquido com carboidrato até 2 horas antes)",
          "Fios de sutura: absorvíveis, inabsorvíveis, mono e multifilamentares",
          "Incisões abdominais",
          "Drenos de sucção fechada",
          "Pneumoperitônio na laparoscopia e repercussão no DPOC",
          "Atelectasia pós-operatória e analgesia",
          'Deiscência de aponeurose e o líquido "água de carne"',
          "Complicações de estomas (prolapso)",
          "Esterilização e NR-32",
          "Cicatrização: fases, colágeno e vitamina C",
          "Resposta metabólica ao trauma",
          "Crioprecipitado e tromboelastografia",
        ],
        completar: [
          "Antibioticoprofilaxia cirúrgica",
          "Febre no pós-operatório",
          "Risco cardíaco pré-operatório",
        ],
        themes: ["cir-periop"],
      },
      {
        title: "Cirurgia: trauma",
        caiu: [
          "Tamponamento cardíaco",
          "Choque neurogênico contra choque medular",
          "Hemotórax maciço e indicação de toracotomia (acima de 1.500 mL)",
          "Trauma abdominal instável vai para laparotomia",
          "Hematoma retroperitoneal por zona",
          "Controle de danos e transfusão maciça",
          "Ácido tranexâmico até 3 horas do trauma",
          "ATLS em gestante e idoso",
        ],
        completar: [
          "ABCDE do ATLS",
          "Classes de choque hemorrágico",
          "Pneumotórax hipertensivo",
          "FAST",
        ],
        themes: ["cir-trauma"],
      },
      aleatoria("cirurgia", "Cirurgia"),
    ],
  },
  {
    day: 4,
    tasks: [
      {
        title: "Cirurgia: aparelho digestivo, hérnias e vascular",
        caiu: [
          "Apendicite e sua complicação mais comum",
          "Diverticulite e TC com contraste",
          "Úlcera perfurada e pneumoperitônio",
          "Colecistite, coledocolitíase e colangite (Tokyo)",
          "Lesão de via biliar na colecistectomia",
          "Hemorragia digestiva alta: Forrest e manejo inicial",
          "Erradicação do H. pylori",
          "Hérnia inguinal encarcerada e técnica de Bassini",
          "Aneurisma de aorta abdominal: rastreio e ruptura",
          "Câncer gástrico (Lauren, Borrmann), esôfago espinocelular, colangiocarcinoma, cirurgia de Whipple",
          "Pseudocisto de pâncreas, hiperplasia nodular focal, CEAP, D'Amico",
        ],
        completar: [
          "Obstrução intestinal",
          "Pancreatite aguda",
          "Câncer colorretal",
          "Doença orificial",
        ],
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
      {
        title: "Obstetrícia: intercorrências da gestação",
        caiu: [
          "Pré-eclâmpsia, sinais de gravidade e iminência de eclâmpsia",
          "Sulfato de magnésio",
          "Síndrome HELLP",
          "Descolamento prematuro de placenta contra placenta prévia",
          "Sífilis na gestação: penicilina benzatina por fase",
          "Diabetes gestacional: TOTG 75 g e insulina no pós-parto",
          "Colestase gravídica",
          "Oligoidrâmnio e restrição de crescimento",
        ],
        completar: [
          "Hipertensão crônica na gestação",
          "Rotura prematura de membranas",
          "Trabalho de parto prematuro e corticoide",
        ],
        themes: [
          "go-hipertensivas",
          "go-sangramento2",
          "go-infeccoes",
          "go-dmg",
          "go-obstetricia",
        ],
      },
      {
        title: "Obstetrícia: parto e primeira metade",
        caiu: [
          "Estática fetal e apresentação de fronte",
          "Classificação de Robson",
          "Indução após cesárea",
          "Hemorragia pós-parto: os 4 Ts",
          "Abortamento inevitável",
          "Gravidez ectópica e salpingostomia",
        ],
        completar: [
          "Partograma",
          "Mecanismo do parto",
          "Metotrexato na ectópica",
          "Doença trofoblástica",
        ],
        themes: ["go-parto", "go-sangramento1"],
      },
      aleatoria("go", "GO", 20),
    ],
  },
  {
    day: 5,
    tasks: [
      simulado(2025),
      correcao,
      {
        title: "Ginecologia: infecções e colo do útero",
        caiu: [
          "Diferença entre os corrimentos: vaginose, candidíase e tricomoníase",
          "Candidíase recorrente",
          "Úlcera genital: cancroide",
          "DIP: ceftriaxona, doxiciclina e metronidazol",
          "Vulvovaginite inespecífica na infância",
          "Rastreio do câncer de colo pela diretriz brasileira",
          "Conduta na atipia glandular e na HSIL",
          "Achados da colposcopia (vasos atípicos)",
          "Conização para preservar fertilidade",
        ],
        completar: [
          "Sífilis e herpes genital",
          "Cervicite",
          "ASC-US e LSIL",
          "Estadiamento do câncer de colo",
        ],
        themes: ["go-vulvovaginites", "go-colo"],
      },
    ],
  },
  {
    day: 6,
    tasks: [
      {
        title: "Ginecologia: endocrinologia, sangramento e contracepção",
        caiu: [
          "Fisiologia do ciclo menstrual (FSH na transição lútea folicular)",
          "Amenorreia primária: Rokitansky e insensibilidade aos androgênios",
          "SOP: critérios de Rotterdam e tratamento",
          "Puberdade precoce central e teste do GnRH",
          "PALM-COEIN e mioma pela FIGO",
          "Sangramento pós-menopausa e espessura endometrial",
          "Hiperplasia endometrial",
          "Contracepção nos critérios da OMS: lúpus e SAF levam a DIU de cobre",
          "DIU no pós-parto e Lei 14.443 da laqueadura",
          "Endometriose: tratamento clínico com progestágeno",
        ],
        completar: [
          "Amenorreia secundária",
          "Hiperprolactinemia",
          "Infertilidade",
        ],
        themes: [
          "go-endocrino",
          "go-sua",
          "go-contracepcao",
          "go-endometriose",
        ],
      },
      {
        title: "Ginecologia: mama, ovário, climatério e incontinência",
        caiu: [
          "Derrame papilar suspeito",
          "Subtipos moleculares do câncer de mama",
          "Teratoma maduro e imaturo",
          "Estadiamento do câncer de ovário epitelial",
          "Terapia hormonal e janela de oportunidade",
          "Opção não hormonal para fogachos (ISRS)",
          "Urodinâmica: indicações e achados",
        ],
        completar: [
          "Rastreio mamográfico e BI-RADS",
          "Doenças benignas da mama (fibroadenoma, cistos, mastalgia)",
          "Desenvolvimento mamário (Tanner)",
          "Massa anexial: benigna ou maligna",
        ],
        themes: ["go-mama", "go-ovario", "go-climaterio", "go-incontinencia"],
      },
      {
        title: "Clínica: pulmão, sangue e outros temas",
        caiu: [
          "DPOC: broncodilatador de longa ação e oxigênio domiciliar",
          "PAC e risco de Pseudomonas",
          "Nódulo e câncer de pulmão",
          "Anemia falciforme: síndrome torácica aguda",
          "Leucemia mieloide crônica e t(9;22)",
          "Inibidor de SGLT2 e fratura atípica por bifosfonato",
          "Artrite reumatoide e nefrite lúpica",
          "Conduta na mordedura de cão e hanseníase",
        ],
        completar: [
          "Asma no adulto",
          "Anemias carenciais",
          "Leucemias agudas e linfomas",
          "Tromboembolismo pulmonar",
        ],
        themes: ["cm-pneumo", "cm-hemato", "cm-outros"],
      },
      aleatoria("go", "GO"),
    ],
  },
  {
    day: 7,
    tasks: [
      {
        title: "Pediatria: recém-nascido, puericultura e vacinas",
        caiu: [
          "Reanimação neonatal com líquido meconial",
          "Teste do coraçãozinho",
          "Sala de parto do filho de mãe com HIV",
          "Toxoplasmose congênita",
          "Sepse neonatal e desconforto respiratório",
          "Icterícia fisiológica contra patológica",
          "Síndrome alcoólica fetal e hipotireoidismo congênito",
          "Ordenha e conservação do leite humano",
          "Ferro profilático pela SBP",
          "Obesidade, desnutrição e transição nutricional",
          "Baixa estatura (SHOX)",
          "Marcos e reflexos do desenvolvimento, sinais de autismo",
          "Dentição e higiene oral",
          "Vacina no prematuro, BCG e tríplice viral",
        ],
        completar: [
          "Calendário do PNI inteiro",
          "Triagem neonatal",
          "Fototerapia",
        ],
        themes: ["ped-neonatologia", "ped-puericultura", "ped-imunizacao"],
      },
      {
        title: "Pediatria: doenças da infância",
        caiu: [
          "Meningite bacteriana pelo líquor",
          "Sarampo e mão-pé-boca",
          "Faringite estreptocócica e mononucleose",
          "Síndrome da pele escaldada e osteomielite por Kingella",
          "Bronquiolite, asma, pneumonia e corpo estranho",
          "Coarctação da aorta, sopro inocente e profilaxia da febre reumática",
          "Esferocitose, anemia macrocítica e tumor de Wilms",
          "ITU, SHU e válvula de uretra posterior",
          "Diabetes na criança e MODY",
          "Doença celíaca, reidratação oral e Meckel",
          "Convulsão febril, Guillain-Barré e epilepsia rolândica",
          "Henoch-Schönlein e Kawasaki",
          "Epifisiólise, doença granulomatosa crônica e choque no trauma",
        ],
        completar: [
          "Escarlatina e varicela",
          "Cardiopatias cianóticas",
          "Invaginação intestinal",
          "Neuroblastoma",
        ],
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
      aleatoria("pediatria", "Pediatria"),
    ],
  },
  {
    day: 8,
    tasks: [
      {
        title: "Clínica: coração e rim",
        caiu: [
          "Insuficiência cardíaca com fração reduzida: betabloqueador, IECA e as drogas que mudam mortalidade",
          "IAM com supra",
          "Fibrilação atrial e anticoagulação com INR",
          "QT longo por azitromicina e hidroxicloroquina",
          "Síncope vasovagal",
          "Estatina pelo risco cardiovascular",
          "Hipertensão renovascular",
          "Indicação cirúrgica na endocardite",
          "Hipercalemia: gluconato de cálcio primeiro",
          "Hipercalcemia grave: hidratação",
          "Lesão renal por AINE e por contraste",
          "Cálculo de ácido úrico",
          "SHU por E. coli",
          "Anemia e hiperparatireoidismo da DRC",
          "Pielonefrite na TC",
        ],
        completar: [
          "Metas de hipertensão",
          "Hiponatremia",
          "Gasometria",
          "Síndrome coronariana sem supra",
        ],
        themes: ["cm-cardio", "cm-nefro"],
      },
      {
        title: "Clínica: fígado, neurologia e emergência",
        caiu: [
          "Encefalopatia hepática e lactulose",
          "Sorologia das hepatites e antivirais na hepatite C",
          "Hepatite fulminante e critérios do King's College",
          "Ascite e GASA",
          "Colecistite alitiásica, sangramento diverticular, BISAP",
          "Delirium e anticolinérgicos",
          "Wernicke: tiamina antes da glicose",
          "Cefaleia em salvas e miastenia gravis",
          "Choque: SvcO2, lactato, noradrenalina e vasopressina",
          "Intoxicação por organofosforado e por salicilato",
          "Avaliação clínica após tentativa de suicídio",
        ],
        completar: ["Cirrose: PBE e varizes", "AVC", "Pacote da sepse"],
        themes: ["cm-figado", "cm-neuro", "cm-emergencia"],
      },
      aleatoria("clinica", "Clínica"),
    ],
  },
  {
    day: 9,
    tasks: [
      simulado(2026),
      correcao,
      {
        title: "Revisar os erros dos três simulados, tópico por tópico",
        review: true,
      },
    ],
  },
];

// Teto de questões de um mini simulado; tarefas com mais temas sorteiam.
export const miniLimit = 15;

export const miniId = (day: number, task: number) => `revisao-d${day}-t${task}`;

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
