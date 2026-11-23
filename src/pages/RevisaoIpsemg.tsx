import { useState } from "react";
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
  shiftLabels,
  themeQuestionIds,
  themes,
  type Shift,
  type ThemeId,
} from "../data/revisao-ipsemg";

export type MiniRequest = {
  id: string;
  title: string;
  ids: string[];
  limit: number;
};

const SPARE_KEY = "residencia.revisao.guardar";

// Último resultado de um turno, para marcar o que já foi feito.
function lastResult(attempts: Attempt[], prefix: string) {
  const done = attempts
    .filter(
      (a) => a.status === "finished" && a.exam.id.startsWith(`${prefix}-`),
    )
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1));
  return done[0]?.result?.percentage;
}

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
  const [spare, setSpare] = useState(() => {
    try {
      return localStorage.getItem(SPARE_KEY) === "sim";
    } catch {
      return false;
    }
  });
  function toggleSpare(next: boolean) {
    setSpare(next);
    try {
      localStorage.setItem(SPARE_KEY, next ? "sim" : "nao");
    } catch {
      /* A escolha vale só nesta visita. */
    }
  }
  const fullDone = (year: number) =>
    attempts.some(
      (a) => a.status === "finished" && a.exam.id === `ipsemg-${year}`,
    );
  return (
    <>
      <span className="eyebrow">REVISÃO PARA A PROVA DO IPSEMG</span>
      <div className="section-heading">
        <div>
          <h1>Cronograma de 9 dias</h1>
          <p>
            Cada turno de teoria tem um mini simulado com as questões do IPSEMG
            2024, 2025 e 2026 dos temas daquele turno. Os temas saíram da
            leitura das 300 questões das três provas.
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
            questões repetidas, mas alguns turnos ficam com poucas questões.
          </small>
        </span>
      </label>
      <div className="plan">
        {plan.map(({ day, slots }) => (
          <section key={day} className="card plan-day">
            <h2>
              <CalendarDays size={18} /> Dia {day}
            </h2>
            <div className="plan-slots">
              {(Object.keys(slots) as Shift[]).map((shift) => {
                const slot = slots[shift];
                const prefix = miniId(day, shift);
                const ids = slot.themes
                  ? themeQuestionIds(slot.themes, day, spare)
                  : [];
                const size = Math.min(ids.length, miniLimit);
                const last = lastResult(attempts, prefix);
                return (
                  <div key={shift} className="plan-slot">
                    <span className="plan-shift">{shiftLabels[shift]}</span>
                    <p>{slot.text}</p>
                    {slot.themes && (
                      <p className="plan-themes">
                        {slot.themes
                          .map((t: ThemeId) => themes[t].label)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="plan-actions">
                      {slot.full && (
                        <button
                          className="primary"
                          disabled={blocked}
                          onClick={() => start(`ipsemg-${slot.full}`)}
                        >
                          Simulado IPSEMG {slot.full} <ArrowRight size={16} />
                        </button>
                      )}
                      {slot.full && fullDone(slot.full) && (
                        <span className="badge">Feito</span>
                      )}
                      {slot.themes &&
                        (size ? (
                          <button
                            className="primary"
                            disabled={blocked}
                            onClick={() =>
                              startMini({
                                id: prefix,
                                title: `Revisão IPSEMG · Dia ${day} · ${shiftLabels[shift]}`,
                                ids: themeQuestionIds(slot.themes!, day, spare),
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
                          Último:{" "}
                          {last === null ? "sem nota" : `${Math.round(last)}%`}
                        </span>
                      )}
                      {slot.random && (
                        <button
                          className="secondary"
                          disabled={blocked}
                          onClick={() =>
                            startRandom({
                              count: slot.random!.count,
                              areas: [slot.random!.area],
                            })
                          }
                        >
                          <Shuffle size={16} /> Aleatória · {slot.random.count}{" "}
                          questões
                        </button>
                      )}
                      {slot.review && (
                        <Link className="secondary" to="/historico">
                          <History size={16} /> Abrir o histórico
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="notice">
        A prova aleatória sorteia do banco inteiro (IPSEMG, PSU-MG e Santa Casa
        BH). Os mini simulados usam só o IPSEMG e nunca trazem questões
        anuladas. Depois do dia 9, use os dias que sobram para refazer os turnos
        em que você foi pior e deixe a véspera leve.
      </p>
    </>
  );
}
