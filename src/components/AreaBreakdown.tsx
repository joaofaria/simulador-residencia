import { areaLabels } from "../types";
import type { AreaScore } from "../services/session";
export function AreaBreakdown({ scores }: { scores: AreaScore[] }) {
  const values = scores.map((s) => s.percentage);
  const lowest = Math.min(...values);
  // Só destaca a área mais fraca quando há diferença entre as áreas.
  const flag = lowest < Math.max(...values);
  return (
    <div className="card area-card">
      {scores.map((s) => (
        <div className="area-row" key={s.area}>
          <div className="area-name">
            <strong>{areaLabels[s.area]}</strong>
            {flag && s.percentage === lowest && (
              <span className="badge incorrect">Mais fraca</span>
            )}
          </div>
          <div className="area-bar" aria-hidden="true">
            <span style={{ width: `${s.percentage}%` }} />
          </div>
          <span className="area-value">
            <strong>{s.percentage.toFixed(1)}%</strong> {s.correct}/{s.valid}
          </span>
        </div>
      ))}
    </div>
  );
}
