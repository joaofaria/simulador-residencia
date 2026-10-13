import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  Clock,
  BookOpen,
  History,
  CheckCircle2,
  ShieldCheck,
  Play,
} from "lucide-react";
import { exams } from "../data/catalog";
import type { Attempt } from "../types";
import { formatTime } from "../services/session";
import { AttemptRow } from "../components/AttemptRow";
export function Home({
  attempts,
  start,
  blocked,
}: {
  attempts: Attempt[];
  start: (id: string) => void;
  blocked: boolean;
}) {
  const [institution, setInstitution] = useState("PSU-MG");
  const [year, setYear] = useState(2026);
  const exam = exams.find(
    (e) => e.institution === institution && e.year === year,
  );
  const active = attempts.filter((a) => a.status !== "finished");
  const completed = attempts.filter((a) => a.status === "finished");
  const available = exam?.questions.every((q) => q.review === "approved")
    ? exam.questions.length
    : 0;
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            <span className="dot" /> SEU PRÓXIMO PASSO COMEÇA AQUI
          </span>
          <h1>
            Prepare-se com foco.
            <br />
            <span>Avance com confiança.</span>
          </h1>
          <p>
            Pratique para a residência médica, acompanhe seu ritmo
            <br className="desktop" /> e transforme cada simulado em
            aprendizado.
          </p>
          <div className="hero-tags">
            <span>
              <Clock size={16} /> Tempo por questão
            </span>
            <span>
              <ShieldCheck size={16} /> Revisão do desempenho
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-ring" />
          <GraduationCap size={90} strokeWidth={1.3} />
          <span className="art-chip">
            <CheckCircle2 size={16} /> Um passo de cada vez
          </span>
        </div>
      </section>
      <div className="section-heading">
        <h2>Seu próximo simulado</h2>
        <span>Acesso direto · R1</span>
      </div>
      <section className="home-grid">
        <div className="card selection">
          <div className="card-heading">
            <span className="small-icon">
              <BookOpen size={22} />
            </span>
            <div>
              <h3>Escolha sua prova</h3>
              <p>PSU-MG e Santa Casa de Belo Horizonte</p>
            </div>
          </div>
          <div className="fields">
            <label>
              Instituição
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              >
                <option>PSU-MG</option>
                <option>Santa Casa BH</option>
              </select>
            </label>
            <label>
              Ano de ingresso
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[2026, 2025, 2024].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="exam-summary">
            <span>{available} questões disponíveis</span>
            <span className="badge">
              {available ? "Pronta para praticar" : "Em validação"}
            </span>
          </div>
          {available > 0 && exam?.keySource && (
            <p className="notice">
              Correção com o gabarito do PDF validado para uso pessoal.
            </p>
          )}
          {!available && (
            <p className="notice">
              PDF original disponível. {exam?.draftCount ?? 0} questões
              extraídas aguardam revisão. A transcrição e o gabarito ainda
              precisam de conferência antes de liberar esta prova.
            </p>
          )}
          <button
            className="primary wide"
            disabled={!available || blocked}
            onClick={() => exam && start(exam.id)}
          >
            Iniciar simulado <ArrowRight size={18} />
          </button>
          {exam?.pdf && (
            <a
              className="source"
              target="_blank"
              rel="noreferrer"
              href={import.meta.env.BASE_URL + exam.pdf}
            >
              Abrir PDF original
            </a>
          )}
        </div>
        <aside className="card focus-card">
          <span className="eyebrow">ESTUDE NO SEU RITMO</span>
          <h3>
            Cada questão conta.
            <br />
            Cada minuto também.
          </h3>
          <p>
            Navegue livremente, deixe questões em branco e volte quando
            precisar.
          </p>
          <div className="feature">
            <Clock size={19} />
            <span>
              Dois cronômetros, um objetivo
              <small>Tempo total e tempo individual acumulado.</small>
            </span>
          </div>
          <div className="feature">
            <ShieldCheck size={19} />
            <span>
              Seu progresso fica salvo
              <small>Interrupções pausam a contagem de tempo.</small>
            </span>
          </div>
        </aside>
      </section>
      <section className="demo-banner">
        <div>
          <span className="badge">DEMONSTRAÇÃO FICTÍCIA</span>
          <h3>Experimente o fluxo completo</h3>
          <p>
            3 itens de interface, sem conteúdo médico ou vínculo com provas
            reais.
          </p>
        </div>
        <button
          className="secondary"
          disabled={blocked}
          onClick={() => start("demo")}
        >
          Testar simulador <ArrowRight size={17} />
        </button>
      </section>
      {active.length > 0 && (
        <section>
          <div className="section-heading">
            <h2>Continue de onde parou</h2>
          </div>
          {active.map((a) => (
            <div className="history-row card" key={a.id}>
              <div>
                <h3>{a.exam.title}</h3>
                <p>
                  {Object.keys(a.answers).length}/{a.exam.questions.length}{" "}
                  respondidas · {formatTime(a.totalMs)}
                </p>
              </div>
              <Link className="secondary" to={`/simulado/${a.id}`}>
                Continuar <Play size={15} />
              </Link>
            </div>
          ))}
        </section>
      )}
      <div className="section-heading">
        <h2>Últimas tentativas</h2>
        <Link to="/historico">
          Ver histórico <ArrowRight size={15} />
        </Link>
      </div>
      {completed.length ? (
        completed.slice(0, 3).map((a) => <AttemptRow key={a.id} attempt={a} />)
      ) : (
        <div className="empty">
          <History size={26} />
          <div>
            <h3>Seu progresso começa com a primeira tentativa</h3>
            <p>Os resultados e tempos dos seus simulados aparecerão aqui.</p>
          </div>
        </div>
      )}
    </>
  );
}
