import { Link } from "react-router-dom";
import { areaShortLabels, type Area, type Attempt } from "../types";
import { score, scoreByArea, formatTime } from "../services/session";
export function AttemptRow({
  attempt: a,
  lookup,
}: {
  attempt: Attempt;
  lookup?: Record<string, Area>;
}) {
  const s = score(a);
  const byArea = scoreByArea([a], lookup);
  return (
    <Link className="history-row card" to={`/resultado/${a.id}`}>
      <div>
        <h3>
          {a.exam.title}
          {a.exam.demo && " · Fictício"}
        </h3>
        <p>
          {new Date(a.finishedAt ?? a.startedAt).toLocaleString("pt-BR")} ·{" "}
          {formatTime(a.totalMs)}
        </p>
        {byArea.length > 0 && (
          <p className="area-line">
            {byArea
              .map(
                (x) =>
                  `${areaShortLabels[x.area]} ${x.percentage.toFixed(0)}%`,
              )
              .join(" · ")}
          </p>
        )}
      </div>
      <strong>
        {s.percentage === null ? "Pendente" : `${s.percentage.toFixed(1)}%`}
      </strong>
    </Link>
  );
}
