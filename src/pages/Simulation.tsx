import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  Pause,
  Play,
  ArrowLeft,
  ArrowRight,
  PawPrint,
} from "lucide-react";
import type { Attempt } from "../types";
import {
  pause,
  resume,
  navigate as move,
  answer,
  finish,
  formatTime,
} from "../services/session";
import { QuestionView } from "../components/QuestionView";
import { Missing } from "../components/Missing";
import { Thor } from "../components/Thor";
import { ConfirmDialog } from "../components/ConfirmDialog";
export function Simulation({
  attempts,
  update,
}: {
  attempts: Attempt[];
  update: (id: string, fn: (a: Attempt) => Attempt) => void;
}) {
  const { id } = useParams();
  const nav = useNavigate();
  const a = attempts.find((x) => x.id === id);
  const [confirm, setConfirm] = useState(false);
  const questionRef = useRef<HTMLElement>(null);
  const previousQuestion = useRef<string | null>(null);
  const activeQuestion = a ? `${a.id}:${a.current}` : null;
  useEffect(() => {
    if (
      previousQuestion.current !== null &&
      previousQuestion.current !== activeQuestion
    ) {
      questionRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
    previousQuestion.current = activeQuestion;
  }, [activeQuestion]);
  if (!a) return <Missing />;
  if (a.status === "finished")
    return (
      <div className="card">
        <Link to={`/resultado/${a.id}`}>Ver resultado desta tentativa</Link>
      </div>
    );
  const q = a.exam.questions[a.current];
  const answered = Object.keys(a.answers).length;
  const blank = a.exam.questions.length - answered;
  return (
    <>
      <div className="exam-top">
        <div>
          <span className="eyebrow">
            {a.exam.demo ? "DEMONSTRAÇÃO FICTÍCIA" : "ACESSO DIRETO · R1"}
          </span>
          <h1>{a.exam.title}</h1>
        </div>
        <div className="timer">
          <Clock size={20} />
          <div>
            <small>Tempo total</small>
            <strong>{formatTime(a.totalMs)}</strong>
          </div>
          <button
            className="icon-button"
            aria-label={a.status === "running" ? "Pausar" : "Retomar"}
            onClick={() =>
              update(a.id, (x) =>
                x.status === "running"
                  ? pause(x, Date.now())
                  : resume(x, Date.now()),
              )
            }
          >
            {a.status === "running" ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      </div>
      {a.status === "paused" && (
        <div className="warning">
          Sessão pausada. O tempo fora da sessão não é contado.{" "}
          <button onClick={() => update(a.id, (x) => resume(x, Date.now()))}>
            Retomar simulado
          </button>
        </div>
      )}
      <div className="progress-caption">
        <span>
          {answered} de {a.exam.questions.length} respondidas
        </span>
        <span>{Math.round((answered / a.exam.questions.length) * 100)}%</span>
      </div>
      <div className="progress">
        <div
          style={{ width: `${(answered / a.exam.questions.length) * 100}%` }}
        />
        <span
          className="progress-paw"
          aria-hidden="true"
          style={{
            left: `clamp(12px, ${(answered / a.exam.questions.length) * 100}%, calc(100% - 12px))`,
          }}
        >
          <PawPrint size={13} />
        </span>
      </div>
      <div className="simulation-grid">
        <section className="card question-card" ref={questionRef}>
          <div className="question-heading">
            <span className="badge">QUESTÃO {q.number}</span>
            <span>
              <Clock size={15} /> Nesta questão:{" "}
              {formatTime(a.times[q.id] ?? 0)}
            </span>
          </div>
          {q.key.status === "annulled" && (
            <p className="warning">
              Esta questão foi anulada pela banca e não conta na sua nota. Pode
              responder mesmo assim, se quiser treinar.
            </p>
          )}
          {q.review === "required" && (
            <p className="warning">Transcrição pendente de revisão manual.</p>
          )}
          <QuestionView
            question={q}
            selected={a.answers[q.id]}
            onSelect={(letter) =>
              update(a.id, (x) => answer(x, letter, Date.now()))
            }
          />
          <button
            className="text-button"
            onClick={() =>
              update(a.id, (x) => answer(x, undefined, Date.now()))
            }
          >
            Limpar resposta
          </button>
          <div className="question-footer">
            <button
              className="secondary"
              disabled={a.current === 0}
              onClick={() =>
                update(a.id, (x) => move(x, x.current - 1, Date.now()))
              }
            >
              <ArrowLeft size={16} /> Anterior
            </button>
            <span>
              {a.current + 1} / {a.exam.questions.length}
            </span>
            {a.current === a.exam.questions.length - 1 ? (
              <button className="primary" onClick={() => setConfirm(true)}>
                Finalizar simulado
              </button>
            ) : (
              <button
                className="primary"
                onClick={() =>
                  update(a.id, (x) => move(x, x.current + 1, Date.now()))
                }
              >
                Próxima <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
        <aside className="card navigation-card">
          <Thor className="nav-puppy" size={48} />
          <h3>Navegação da prova</h3>
          <p>Volte a qualquer questão.</p>
          <div className="number-grid">
            {a.exam.questions.map((item, i) => (
              <button
                key={item.id}
                aria-label={`Questão ${item.number}, ${a.answers[item.id] ? "respondida" : "não respondida"}`}
                aria-current={i === a.current ? "step" : undefined}
                className={`${a.answers[item.id] ? "answered" : ""} ${i === a.current ? "current" : ""}`}
                onClick={() => update(a.id, (x) => move(x, i, Date.now()))}
              >
                {item.number}
              </button>
            ))}
          </div>
          <p className="legend">
            ● Preenchida: respondida · Borda: atual
            <br />○ Sem preenchimento: não respondida
          </p>
          <button className="primary wide" onClick={() => setConfirm(true)}>
            Finalizar simulado
          </button>
          <Link
            className="source"
            to="/"
            onClick={() => update(a.id, (x) => pause(x, Date.now()))}
          >
            Salvar e sair
          </Link>
        </aside>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Finalizar seu simulado?"
          onClose={() => setConfirm(false)}
        >
          <p>
            {blank === 0
              ? "Você respondeu todas as questões."
              : blank === 1
                ? "1 questão ainda está em branco."
                : `${blank} questões ainda estão em branco.`}{" "}
            Depois de finalizar, as respostas não poderão ser alteradas.
          </p>
          <div className="modal-actions">
            <button
              autoFocus
              className="secondary"
              onClick={() => setConfirm(false)}
            >
              Continuar respondendo
            </button>
            <button
              className="primary"
              onClick={() => {
                update(a.id, (x) => finish(x, Date.now()));
                nav(`/resultado/${a.id}`);
              }}
            >
              Confirmar finalização
            </button>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
