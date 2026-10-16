import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
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
  const [originalMode, setOriginalMode] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const hasOriginal = Boolean(q.originalPages?.length);
  const showOriginal = hasOriginal && originalMode;
  // {{figura}} no enunciado marca onde entram tabelas e figuras; sem a marca,
  // elas ficam logo depois do texto.
  const [before, after = ""] = q.statement.split("\n{{figura}}\n");
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
      {hasOriginal && (
        <div
          className="reading-controls"
          aria-label="Modo de leitura da questão"
        >
          <div className="reading-modes">
            <button
              type="button"
              aria-pressed={originalMode}
              className={originalMode ? "selected" : ""}
              onClick={() => setOriginalMode(true)}
            >
              Original
            </button>
            <button
              type="button"
              aria-pressed={!originalMode}
              className={!originalMode ? "selected" : ""}
              onClick={() => setOriginalMode(false)}
            >
              Texto
            </button>
          </div>
          {showOriginal && (
            <button
              type="button"
              className="text-button zoom-button"
              aria-pressed={zoomed}
              onClick={() => setZoomed(!zoomed)}
            >
              {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}{" "}
              {zoomed ? "Ajustar à tela" : "Ampliar"}
            </button>
          )}
        </div>
      )}
      {showOriginal ? (
        <>
          <div className={`original-reader ${zoomed ? "zoomed" : ""}`}>
            {q.originalPages?.map((original) => (
              <figure key={original.src}>
                <a
                  href={import.meta.env.BASE_URL + original.src}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir original da questão ${q.number}, página ${original.page}`}
                >
                  <img
                    src={import.meta.env.BASE_URL + original.src}
                    alt={original.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <figcaption>
                  Página {original.page}
                  {q.originalPages && q.originalPages.length > 1
                    ? " · continuação da questão"
                    : ""}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="selection-hint">
            Selecione a alternativa correspondente ao documento acima.
          </p>
        </>
      ) : (
        <>
          {hasOriginal && (
            <p className="text-reading-note">
              Texto auxiliar para leitura. Imagens e tabelas estão no modo
              Original.
            </p>
          )}
          {before && <p className="statement">{before}</p>}
          {media}
          {after && <p className="statement">{after}</p>}
        </>
      )}
      <div className={`alternatives ${showOriginal ? "original-options" : ""}`}>
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
                {showOriginal ? `Alternativa ${o.letter}` : o.text}
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
      {q.source.pdf ? (
        <a
          className="source"
          href={`${import.meta.env.BASE_URL}${q.source.pdf}#page=${q.source.pages[0]}`}
          target="_blank"
          rel="noreferrer"
        >
          Consultar prova original · página {q.source.pages.join(", ")}
        </a>
      ) : (
        q.source.credit && (
          <p className="source credit">
            Questão {q.number} · {q.source.credit}
          </p>
        )
      )}
    </>
  );
}
