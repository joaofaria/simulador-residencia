import { Scissors } from "lucide-react";
import type { Question } from "../types";

export function QuestionView({
  question: q,
  selected,
  onSelect,
  reveal = false,
  struck = [],
  onStrike,
}: {
  question: Question;
  selected?: string;
  onSelect?: (letter: string) => void;
  reveal?: boolean;
  struck?: string[];
  onStrike?: (letter: string) => void;
}) {
  // {{figura}} no enunciado marca onde entram tabelas e figuras; sem a marca,
  // elas ficam logo depois do texto.
  const [before, after = ""] = q.statement.split(/\n\{\{figura\}\}\n?/);
  const media = (
    <>
      {q.tables?.map((table, t) => (
        <div className="question-table" key={t}>
          <table>
            <thead>
              <tr>
                {table.header.map((cell, c) => (
                  <th key={c} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {q.images.map((i) => (
        <figure className="question-figure" key={i.src}>
          <a
            href={import.meta.env.BASE_URL + i.src}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir em tamanho real: ${i.alt}`}
          >
            <img
              src={import.meta.env.BASE_URL + i.src}
              alt={i.alt}
              loading="lazy"
              decoding="async"
            />
          </a>
          <figcaption>{i.alt} Toque para ampliar.</figcaption>
        </figure>
      ))}
    </>
  );
  return (
    <>
      {before && <p className="statement">{before}</p>}
      {media}
      {after && <p className="statement">{after}</p>}
      <div className="alternatives">
        {q.alternatives.map((o) => {
          const correct =
            reveal && q.key.status === "verified" && q.key.answer === o.letter;
          const isStruck = struck.includes(o.letter);
          return (
            <div
              className={`alternative-row ${isStruck ? "struck" : ""}`}
              key={o.letter}
            >
              <button
                type="button"
                disabled={!onSelect}
                aria-pressed={selected === o.letter}
                className={`alternative ${selected === o.letter ? "selected" : ""} ${correct ? "correct" : ""}`}
                onClick={() => onSelect?.(o.letter)}
                onContextMenu={(e) => {
                  // Botão direito também risca, como atalho no computador.
                  if (!onStrike) return;
                  e.preventDefault();
                  onStrike(o.letter);
                }}
              >
                <span className="letter">{o.letter}</span>
                <span>
                  {o.text}
                  {isStruck && (
                    <span className="visually-hidden"> (riscada)</span>
                  )}
                  {correct && (
                    <strong className="answer-label">Resposta correta</strong>
                  )}
                  {reveal && selected === o.letter && (
                    <strong className="answer-label">Sua resposta</strong>
                  )}
                </span>
              </button>
              {onStrike && (
                <button
                  type="button"
                  className="strike-button"
                  aria-pressed={isStruck}
                  aria-label={
                    isStruck
                      ? `Desfazer risco da alternativa ${o.letter}`
                      : `Riscar alternativa ${o.letter}`
                  }
                  title={isStruck ? "Desfazer risco" : "Riscar alternativa"}
                  onClick={() => onStrike(o.letter)}
                >
                  <Scissors size={17} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {q.source.credit && (
        <p className="source credit">
          Questão {q.number} · {q.source.credit}
        </p>
      )}
    </>
  );
}
