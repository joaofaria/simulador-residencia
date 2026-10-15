import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, PawPrint, Shuffle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Attempt } from "../types";
import {
  score,
  scoreByArea,
  scoreBand,
  scoreMessage,
  formatTime,
  outcome,
} from "../services/session";
import { questionNumber, questionOrigin } from "../services/random";
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
  retry,
}: {
  attempts: Attempt[];
  retry: (a: Attempt) => void;
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
      : {
          topTop: "proud" as const,
          top: "happy" as const,
          chance: "happy" as const,
          improve: "hopeful" as const,
        }[scoreBand(s.percentage)];
  return (
    <>
      <span className="eyebrow">
        {a.exam.demo
          ? "RESULTADO FICTÍCIO · DEMONSTRAÇÃO"
          : a.exam.random
            ? "PROVA ALEATÓRIA CONCLUÍDA"
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
        <div className="heading-actions">
          {a.exam.random && (
            <Link className="secondary" to="/#prova-aleatoria">
              Sortear outra <Shuffle size={16} />
            </Link>
          )}
          <button className="secondary" onClick={() => retry(a)}>
            {a.exam.random ? "Refazer estas questões" : "Refazer prova"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      {a.exam.random && (
        <p className="notice">
          Esta prova foi montada por sorteio com questões de provas diferentes.
          Serve para treinar e comparar áreas, mas não equivale a uma prova
          real da banca.
        </p>
      )}
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
              <h3>Questão {questionNumber(a.exam, a.exam.questions.indexOf(q))}</h3>
              <span className={`badge ${outcome(q, a.answers[q.id])}`}>
                {labels[outcome(q, a.answers[q.id])]}
              </span>
              <span>{formatTime(a.times[q.id] ?? 0)}</span>
            </div>
            {a.exam.random && (
              <p className="question-origin">{questionOrigin(q)}</p>
            )}
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
