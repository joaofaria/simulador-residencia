import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, Shuffle } from "lucide-react";
import { areas, areaLabels, type Area } from "../types";
import { randomCounts, type RandomConfig } from "../services/random";

export function RandomExamCard({
  startRandom,
  blocked,
}: {
  startRandom: (config: RandomConfig) => void;
  blocked: boolean;
}) {
  const [count, setCount] = useState(20);
  const [chosen, setChosen] = useState<Area[]>([...areas]);
  const ref = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#prova-aleatoria")
      ref.current?.scrollIntoView({ block: "start" });
  }, [hash]);
  const toggle = (area: Area) =>
    setChosen((now) =>
      now.includes(area) ? now.filter((a) => a !== area) : [...now, area],
    );
  const perArea = chosen.length ? count / chosen.length : 0;
  return (
    <section className="card random-card" id="prova-aleatoria" ref={ref}>
      <div className="card-heading">
        <span className="small-icon">
          <Shuffle size={22} />
        </span>
        <div>
          <h3>Prova aleatória</h3>
          <p>Questões sorteadas das seis provas, divididas entre as áreas</p>
        </div>
      </div>
      <label>
        Quantidade de questões
        <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {randomCounts.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="area-picker">
        <legend>Áreas</legend>
        {areas.map((area) => (
          <label key={area} className="area-option">
            <input
              type="checkbox"
              checked={chosen.includes(area)}
              onChange={() => toggle(area)}
            />
            {areaLabels[area]}
          </label>
        ))}
      </fieldset>
      <p className="notice">
        {chosen.length
          ? Number.isInteger(perArea)
            ? `${perArea} ${perArea === 1 ? "questão" : "questões"} de cada área escolhida.`
            : `Cerca de ${Math.round(perArea)} questões de cada área escolhida.`
          : "Escolha pelo menos uma área."}{" "}
        Questões anuladas ficam de fora. É um treino montado pelo sorteio, não
        uma prova real.
      </p>
      <button
        className="primary wide"
        disabled={!chosen.length || blocked}
        onClick={() => startRandom({ count, areas: chosen })}
      >
        Sortear e começar <ArrowRight size={18} />
      </button>
    </section>
  );
}
