import type { Exam } from "../types";
export const demo: Exam = {
  id: "demo",
  institution: "Demonstração fictícia",
  year: 2026,
  title: "Conheça o simulador",
  demo: true,
  questions: [
    {
      id: "demo-1",
      institution: "Demonstração fictícia",
      year: 2026,
      number: 1,
      statement:
        "QUESTÃO FICTÍCIA — TESTE DA INTERFACE\nEste item não é uma questão médica e não pertence a nenhuma prova real. Qual botão permite avançar para o próximo item?",
      alternatives: [
        { letter: "A", text: "Próxima" },
        { letter: "B", text: "Anterior" },
        { letter: "C", text: "Limpar resposta" },
      ],
      key: {
        status: "verified",
        answer: "A",
        source: "Regra fictícia da demonstração; não é gabarito oficial.",
      },
      images: [],
      source: { pdf: "", pages: [] },
      review: "approved",
    },
    {
      id: "demo-2",
      institution: "Demonstração fictícia",
      year: 2026,
      number: 2,
      statement:
        "QUESTÃO FICTÍCIA — TESTE DE ANULAÇÃO\nEste item demonstra como uma questão anulada aparece nos resultados. Escolha qualquer alternativa.",
      alternatives: [
        { letter: "A", text: "Primeira alternativa fictícia" },
        { letter: "B", text: "Segunda alternativa fictícia" },
      ],
      key: { status: "annulled", source: "Anulação fictícia da demonstração." },
      images: [],
      source: { pdf: "", pages: [] },
      review: "approved",
    },
    {
      id: "demo-3",
      institution: "Demonstração fictícia",
      year: 2026,
      number: 3,
      statement:
        "QUESTÃO FICTÍCIA — GABARITO PENDENTE\nEste item demonstra uma questão sem gabarito verificado. Sua resposta será registrada, mas não será pontuada.",
      alternatives: [
        { letter: "A", text: "Alternativa fictícia A" },
        { letter: "B", text: "Alternativa fictícia B" },
      ],
      key: { status: "pending" },
      images: [],
      source: { pdf: "", pages: [] },
      review: "approved",
    },
  ],
};
