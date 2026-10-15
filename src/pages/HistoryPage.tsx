import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import type { Attempt } from "../types";
import { formatTime, scoreByArea } from "../services/session";
import { useAreaLookup } from "../data/areas";
import { AttemptRow } from "../components/AttemptRow";
import { AreaBreakdown } from "../components/AreaBreakdown";
import { Thor } from "../components/Thor";
export function HistoryPage({
  attempts,
  start,
  exportData,
}: {
  attempts: Attempt[];
  start: (id: string) => void;
  exportData: () => void;
}) {
  const lookup = useAreaLookup(attempts);
  const finished = attempts.filter(
    (a) => a.status === "finished" && !a.exam.demo,
  );
  const byArea = scoreByArea(finished, lookup);
  return (
    <>
      <span className="eyebrow">SUA JORNADA DE PREPARAÇÃO</span>
      <div className="section-heading">
        <div>
          <h1>Histórico de simulados</h1>
          <p>Cada tentativa é salva separadamente neste navegador.</p>
        </div>
        <button className="secondary" onClick={exportData}>
          <Download size={16} /> Exportar histórico
        </button>
      </div>
      {byArea.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Desempenho por área</h2>
          </div>
          <AreaBreakdown scores={byArea} />
          <p className="definition">
            Soma de todos os simulados concluídos de provas reais. Acertos
            sobre questões válidas de cada área.
          </p>
          <div className="section-heading">
            <h2>Tentativas</h2>
          </div>
        </>
      )}
      {attempts.length ? (
        attempts.map((a) => (
          <div key={a.id}>
            {a.status === "finished" ? (
              <>
                <AttemptRow attempt={a} lookup={lookup} />
                <button
                  className="text-button"
                  onClick={() => start(a.exam.id)}
                >
                  Refazer esta prova
                </button>
              </>
            ) : (
              <div className="card history-row">
                <div>
                  <h3>{a.exam.title}</h3>
                  <p>Interrompido · {formatTime(a.totalMs)}</p>
                </div>
                <Link className="secondary" to={`/simulado/${a.id}`}>
                  Continuar
                </Link>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="empty">
          <Thor className="puppy" mood="hopeful" size={72} />
          <p>
            Nenhum simulado realizado. <Link to="/">Escolher uma prova</Link>
          </p>
        </div>
      )}
    </>
  );
}
