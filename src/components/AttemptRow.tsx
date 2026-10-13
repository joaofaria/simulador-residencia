import { Link } from "react-router-dom";
import type { Attempt } from "../types";
import { score, formatTime } from "../services/session";
export function AttemptRow({ attempt: a }: { attempt: Attempt }) {
  const s = score(a);
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
      </div>
      <strong>
        {s.percentage === null ? "Pendente" : `${s.percentage.toFixed(1)}%`}
      </strong>
    </Link>
  );
}
