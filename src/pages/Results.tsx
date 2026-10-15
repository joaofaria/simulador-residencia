import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, PawPrint } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Attempt } from "../types";
import {
  score,
  scoreByArea,
  scoreMessage,
  formatTime,
  outcome,
} from "../services/session";
import { useAreaLookup } from "../data/areas";
import { AreaBreakdown } from "../components/AreaBreakdown";
import { QuestionView } from "../components/QuestionView";
import { Missing } from "../components/Missing";
import { Thor, type ThorMood } from "../components/Thor";
const labels = {
  correct: "Correta",
  incorrect: "Incorreta",
  blank: "Em branco",
  annulled: "Anulada",
  pending: "Gabarito pendente",
};
export function Results({
  attempts,
  start,
}: {
  attempts: Attempt[];
  start: (id: string) => void;
}) {
  const { id } = useParams();
  const a = attempts.find((x) => x.id === id);
  const [filter, setFilter] = useState("all");
  const lookup = useAreaLookup(a ? [a] : []);
  if (!a || a.status !== "finished") return <Missing />;
  const s = score(a);
  const byArea = scoreByArea([a], lookup);
  const data = [
    { name: "Acertos", value: s.correct, color: "#e0a03f" },
    { name: "Erros", value: s.incorrect, color: "#d76a63" },
    { name: "Em branco", value: s.blank, color: "#cbbcb0" },
    { name: "Anuladas", value: s.annulled, color: "#8fb3c9" },
    { name: "Pendentes", value: s.pending, color: "#a99ad1" },
  ].filter((x) => x.value > 0);
  // O Thor reage com as mesmas faixas da mensagem de aproveitamento.
  const mood: ThorMood =
    s.percentage === null
      ? "happy"
      : s.percentage >= 85
        ? "proud"
        : s.percentage >= 70
          ? "happy"
          : "hopeful";
  return (
    <>
      <span className="eyebrow">
        {a.exam.demo
          ? "RESULTADO FICTÍCIO · DEMONSTRAÇÃO"
          : "SIMULADO CONCLUÍDO"}
      </span>
      <div className="section-heading">
        <div>
          <h1>Seu desempenho</h1>
          <p>
            {a.exam.title} ·{" "}
            {new Date(a.finishedAt!).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <button className="secondary" onClick={() => start(a.exam.id)}>
          Refazer prova <ArrowRight size={16} />
        </button>
      </div>
      {s.pending > 0 && (
        <p className="warning">
          {s.pending} questões sem gabarito verificado foram excluídas da
          pontuação. Este resultado é parcial.
        </p>
      )}
      <div className="result-grid">
        <section className="card score-card">
          <Thor className="score-thor" mood={mood} size={104} />
          <span className="eyebrow">
            APROVEITAMENTO {s.pending ? "PARCIAL" : ""}
          </span>
          <strong className="big-score">
            {s.percentage === null ? "—" : s.percentage.toFixed(1) + "%"}
          </strong>
          {scoreMessage(s.percentage) && (
            <p>
              <strong>{scoreMessage(s.percentage)}</strong>
            </p>
          )}
          <p>
            {s.correct} acertos em {s.valid} questões válidas com gabarito.
          </p>
          <small>
            Anuladas e pendentes excluídas. Questões válidas em branco contam
            como não acertadas.
          </small>
        </section>
        <section className="card chart-card">
          <div className="chart">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={78}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            {data.map((d) => (
              <p key={d.name}>
                <span style={{ color: d.color }}>●</span> {d.name}{" "}
                <strong>{d.value}</strong>
              </p>
            ))}
          </div>
        </section>
      </div>
      <div className="stats-grid">
        {[
          ["Total de questões", s.total],
          ["Acertos", s.correct],
          ["Erros", s.incorrect],
          ["Em branco (válidas)", s.blank],
          ["Anuladas", s.annulled],
          ["Tempo total", formatTime(a.totalMs)],
          ["Tempo médio", formatTime(s.averageMs)],
        ].map(([label, value]) => (
          <div className="card stat" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="definition">
        Tempo médio = tempo total efetivamente contabilizado ÷ {s.total}{" "}
        questões da prova, incluindo anuladas e pendentes. Respostas ausentes em
        todos os itens:{" "}
        {a.exam.questions.filter((q) => !a.answers[q.id]).length}.
      </p>
      {byArea.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Desempenho por área</h2>
          </div>
          <AreaBreakdown scores={byArea} />
          <p className="definition">
            Acertos sobre questões válidas de cada área, com a mesma regra do
            aproveitamento geral.
          </p>
        </>
      )}
      <div className="section-heading">
        <h2>Revisão das questões</h2>
        <span>
          <PawPrint size={14} /> Bora revisar com o Thor
        </span>
      </div>
      <div className="filters">
        {[["all", "Todas"], ...Object.entries(labels)].map(([key, label]) => (
          <button
            className={filter === key ? "selected" : ""}
            key={key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {a.exam.questions
        .filter(
          (q) => filter === "all" || outcome(q, a.answers[q.id]) === filter,
        )
        .map((q) => (
          <section className="card review-card" key={q.id}>
            <div className="question-heading">
              <h3>Questão {q.number}</h3>
              <span className={`badge ${outcome(q, a.answers[q.id])}`}>
                {labels[outcome(q, a.answers[q.id])]}
              </span>
              <span>{formatTime(a.times[q.id] ?? 0)}</span>
            </div>
            <QuestionView question={q} selected={a.answers[q.id]} reveal />
            <p>
              Sua resposta: {a.answers[q.id] ?? "Em branco"} ·{" "}
              {q.key.status === "verified"
                ? `Gabarito: ${q.key.answer}`
                : q.key.status === "annulled"
                  ? "Questão anulada"
                  : "Sem gabarito verificado"}
            </p>
            {q.key.status !== "pending" && (
              <p className="definition">Fonte do gabarito: {q.key.source}</p>
            )}
          </section>
        ))}
    </>
  );
}
