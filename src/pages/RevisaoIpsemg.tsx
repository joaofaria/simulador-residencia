import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  History,
  Shuffle,
} from "lucide-react";
import type { Attempt } from "../types";
import type { RandomConfig } from "../services/random";
import {
  miniId,
  miniLimit,
  plan,
  themeQuestionIds,
  type Task,
} from "../data/revisao-ipsemg";
import {
  CHANGED_EVENT,
  readMarks,
  setMark,
  SPARE_MARK,
  type Marks,
} from "../services/revisao";

export type MiniRequest = {
  id: string;
  title: string;
  ids: string[];
  limit: number;
};

function doneSet(marks: Marks) {
  return new Set(
    Object.entries(marks)
      .filter(([k, m]) => k !== SPARE_MARK && m.on)
      .map(([k]) => k),
  );
}

// Último resultado de uma tarefa, para marcar o que já foi feito.
function lastResult(attempts: Attempt[], prefix: string) {
  const done = attempts
    .filter(
      (a) => a.status === "finished" && a.exam.id.startsWith(`${prefix}-`),
    )
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1));
  return done[0]?.result?.percentage;
}

// Chave de um tópico no navegador: dia, tarefa e o próprio texto, para que
// mudar a ordem das tarefas não marque o tópico errado.
const topicKey = (day: number, task: number, topic: string) =>
  `${day}:${task}:${topic}`;

export function RevisaoIpsemg({
  attempts,
  start,
  startRandom,
  startMini,
  blocked,
}: {
  attempts: Attempt[];
  start: (id: string) => void;
  startRandom: (config: RandomConfig) => void;
  startMini: (req: MiniRequest) => void;
  blocked: boolean;
}) {
  const [marks, setMarks] = useState(readMarks);
  // A conta pode trazer marcas de outro navegador com a página aberta.
  useEffect(() => {
    const refresh = () => setMarks(readMarks());
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHANGED_EVENT, refresh);
  }, []);
  const spare = !!marks[SPARE_MARK]?.on;
  const done = doneSet(marks);
  function toggleSpare(next: boolean) {
    setMark(SPARE_MARK, next);
  }
  function toggleTopic(key: string) {
    setMark(key, !done.has(key));
  }
  const fullDone = (year: number) =>
    attempts.some(
      (a) => a.status === "finished" && a.exam.id === `ipsemg-${year}`,
    );

  function topicList(day: number, n: number, topics: string[]) {
    return (
      <ul className="plan-topics">
        {topics.map((topic) => {
          const key = topicKey(day, n, topic);
          return (
            <li key={topic}>
              <label className={done.has(key) ? "checked" : ""}>
                <input
                  type="checkbox"
                  checked={done.has(key)}
                  onChange={() => toggleTopic(key)}
                />
                <span>{topic}</span>
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  function taskView(day: number, n: number, task: Task) {
    const prefix = miniId(day, n);
    const ids = task.themes ? themeQuestionIds(task.themes, day, spare) : [];
    const size = Math.min(ids.length, miniLimit);
    const last = lastResult(attempts, prefix);
    const topics = [...(task.caiu ?? []), ...(task.completar ?? [])];
    const checked = topics.filter((t) => done.has(topicKey(day, n, t))).length;
    return (
      <div key={n} className="plan-task">
        <div className="plan-task-head">
          <span className="plan-shift">Tarefa {n}</span>
          {topics.length > 0 && (
            <span className="plan-count">
              {checked} de {topics.length} revisados
            </span>
          )}
        </div>
        <h3>{task.title}</h3>
        {task.caiu && (
          <>
            <p className="plan-label">Caiu nas provas</p>
            {topicList(day, n, task.caiu)}
          </>
        )}
        {task.completar && (
          <>
            <p className="plan-label">Para completar</p>
            {topicList(day, n, task.completar)}
          </>
        )}
        <div className="plan-actions">
          {task.full && (
            <button
              className="primary"
              disabled={blocked}
              onClick={() => start(`ipsemg-${task.full}`)}
            >
              Simulado IPSEMG {task.full} <ArrowRight size={16} />
            </button>
          )}
          {task.full && fullDone(task.full) && (
            <span className="badge">Feito</span>
          )}
          {task.themes &&
            (size ? (
              <button
                className="primary"
                disabled={blocked}
                onClick={() =>
                  startMini({
                    id: prefix,
                    title: `Revisão IPSEMG · Dia ${day} · Tarefa ${n}`,
                    ids,
                    limit: miniLimit,
                  })
                }
              >
                <ClipboardList size={16} /> Mini simulado · {size}{" "}
                {size === 1 ? "questão" : "questões"}
              </button>
            ) : (
              <span className="plan-empty">
                Sem questões antes do simulado completo
              </span>
            ))}
          {last !== undefined && (
            <span className="badge">
              Último: {last === null ? "sem nota" : `${Math.round(last)}%`}
            </span>
          )}
          {task.random && (
            <button
              className="primary"
              disabled={blocked}
              onClick={() =>
                startRandom({
                  count: task.random!.count,
                  areas: [task.random!.area],
                })
              }
            >
              <Shuffle size={16} /> Começar
            </button>
          )}
          {task.review && (
            <Link className="secondary" to="/historico">
              <History size={16} /> Abrir o histórico
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <span className="eyebrow">REVISÃO PARA A PROVA DO IPSEMG</span>
      <div className="section-heading">
        <div>
          <h1>Cronograma de 9 dias</h1>
          <p>
            Cada dia tem suas tarefas, sem horário fixo: faça na ordem que
            couber no seu dia. Marque cada tópico quando revisar e feche a
            tarefa com o mini simulado, que traz as questões do IPSEMG 2024 a
            2026 daqueles tópicos.
          </p>
        </div>
      </div>
      <label className="spare-toggle card">
        <input
          type="checkbox"
          checked={spare}
          onChange={(e) => toggleSpare(e.target.checked)}
        />
        <span>
          Guardar as provas dos simulados completos
          <small>
            Até o dia 5, os mini simulados não usam questões de 2025, e até o
            dia 9 não usam as de 2026. Assim os simulados completos chegam sem
            questões repetidas, mas algumas tarefas ficam com poucas questões.
          </small>
        </span>
      </label>
      <div className="plan">
        {plan.map(({ day, tasks }) => (
          <section key={day} className="card plan-day">
            <h2>
              <CalendarDays size={18} /> Dia {day}
            </h2>
            <div className="plan-tasks">
              {tasks.map((task, i) => taskView(day, i + 1, task))}
            </div>
          </section>
        ))}
      </div>
      <p className="notice">
        As marcações ficam salvas só neste navegador. A prova aleatória sorteia
        do banco inteiro (IPSEMG, PSU-MG e Santa Casa BH); os mini simulados
        usam só o IPSEMG e nunca trazem questões anuladas.
      </p>
    </>
  );
}
