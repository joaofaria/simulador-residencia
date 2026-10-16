import type { Question } from "../types";

export function QuestionView({
  question: q,
  selected,
  onSelect,
  reveal = false,
}: {
  question: Question;
  selected?: string;
  onSelect?: (letter: string) => void;
  reveal?: boolean;
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
          return (
            <button
              type="button"
              disabled={!onSelect}
              key={o.letter}
              aria-pressed={selected === o.letter}
              className={`alternative ${selected === o.letter ? "selected" : ""} ${correct ? "correct" : ""}`}
              onClick={() => onSelect?.(o.letter)}
            >
              <span className="letter">{o.letter}</span>
              <span>
                {o.text}
                {correct && (
                  <strong className="answer-label">Resposta correta</strong>
                )}
                {reveal && selected === o.letter && (
                  <strong className="answer-label">Sua resposta</strong>
                )}
              </span>
            </button>
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
