import { useEffect, useState } from "react";
import type { Area, Attempt } from "../types";
import { loadExam } from "./load";
// Tentativas salvas antes da marcação de área guardam a prova sem o campo
// `area`. Carrega a versão atual dessas provas para recuperar a área de cada
// questão pelo id.
export function useAreaLookup(attempts: Attempt[]) {
  const [lookup, setLookup] = useState<Record<string, Area>>({});
  const missing = [
    ...new Set(
      attempts
        .filter((a) => !a.exam.demo && a.exam.questions.some((q) => !q.area))
        .map((a) => a.exam.id),
    ),
  ]
    .sort()
    .join(",");
  useEffect(() => {
    if (!missing) return;
    let alive = true;
    Promise.allSettled(missing.split(",").map(loadExam)).then((results) => {
      if (!alive) return;
      const next: Record<string, Area> = {};
      for (const r of results)
        if (r.status === "fulfilled")
          for (const q of r.value.questions) if (q.area) next[q.id] = q.area;
      setLookup(next);
    });
    return () => {
      alive = false;
    };
  }, [missing]);
  return lookup;
}
