import { Link } from "react-router-dom";
import { Download, History } from "lucide-react";
import type { Attempt } from "../types";
import { formatTime } from "../services/session";
import { AttemptRow } from "../components/AttemptRow";
export function HistoryPage({
  attempts,
  start,
  exportData,
}: {
  attempts: Attempt[];
  start: (id: string) => void;
  exportData: () => void;
}) {
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
      {attempts.length ? (
        attempts.map((a) => (
          <div key={a.id}>
            {a.status === "finished" ? (
              <>
                <AttemptRow attempt={a} />
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
          <History />
          <p>
            Nenhum simulado realizado. <Link to="/">Escolher uma prova</Link>
          </p>
        </div>
      )}
    </>
  );
}
