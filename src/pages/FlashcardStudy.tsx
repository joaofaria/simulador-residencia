import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Undo2 } from "lucide-react";
import { Thor } from "../components/Thor";
import { CardFace } from "../flashcards/CardFace";
import {
  getCollection,
  loadCards,
  loadNote,
  saveAnswer,
} from "../flashcards/db";
import {
  answer,
  buildQueue,
  counts,
  dayNumber,
  deckTree,
  findDeck,
  formatDelay,
  nextCard,
  nextDelay,
  ratingLabels,
  recordAnswer,
  type Rating,
} from "../flashcards/scheduler";
import { renderCard } from "../flashcards/template";
import type { Card, Collection } from "../flashcards/types";
import { DECK_SEPARATOR } from "../flashcards/types";

const ratings: Rating[] = [1, 2, 3, 4];

type Undo = { card: Card; col: Collection; shown: Shown };
type Shown = { fresh: number; review: number };

export function FlashcardStudy({ dark }: { dark: boolean }) {
  const { col: colId = "", deck = "" } = useParams();
  const [col, setCol] = useState<Collection | null>();
  const [cards, setCards] = useState<Map<string, Card>>();
  const [now, setNow] = useState(() => Date.now());
  const [shown, setShown] = useState<Shown>({ fresh: 0, review: 0 });
  const [revealed, setRevealed] = useState(false);
  const [face, setFace] = useState<{ key: string; question: string; answer: string; css: string }>();
  const [undo, setUndo] = useState<Undo[]>([]);
  const [saveError, setSaveError] = useState("");
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    void Promise.all([getCollection(colId), loadCards(colId)])
      .then(([c, list]) => {
        if (!alive) return;
        setCol(c ?? null);
        setCards(new Map(list.map((x) => [x.key, x])));
      })
      .catch(() => alive && setCol(null));
    return () => {
      alive = false;
    };
  }, [colId]);

  const node = useMemo(
    () => (cards ? findDeck(deckTree([...cards.values()]), deck) : undefined),
    [cards, deck],
  );
  const queue = useMemo(
    () => (node && col ? buildQueue(node, col, now) : undefined),
    [node, col, now],
  );
  const current = queue ? nextCard(queue, now, shown) : undefined;

  // Monta a frente e o verso do cartão atual a partir da nota.
  useEffect(() => {
    if (!current || !col || face?.key === current.key) return;
    let alive = true;
    void loadNote(col.id, current.note).then((note) => {
      if (!alive) return;
      const model = note && col.models[String(note.model)];
      const html = note && model
        ? renderCard(model, note.fields, note.tags, current.deck, current.ord)
        : { question: "Não foi possível abrir este cartão.", answer: "" };
      setFace({ key: current.key, css: model?.css ?? "", ...html });
      setRevealed(false);
    });
    return () => {
      alive = false;
    };
  }, [current, col, face?.key]);

  // Um cartão em aprendizado volta sozinho quando chega a hora.
  useEffect(() => {
    if (current || !queue?.later.length) return;
    const wait = Math.max(1000, queue.later[0].due - Date.now() - 20 * 60_000);
    const t = setTimeout(() => setNow(Date.now()), Math.min(wait, 60_000));
    return () => clearTimeout(t);
  }, [current, queue]);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!current || !col || !cards || busy.current) return;
      busy.current = true;
      const at = Date.now();
      const today = dayNumber(at);
      const after = answer(current, rating, at, col.conf, today);
      const nextCol = recordAnswer(col, current, today);
      try {
        await saveAnswer(nextCol, after);
        setUndo((u) => [...u.slice(-19), { card: current, col, shown }]);
        setShown((s) => ({
          fresh: s.fresh + (current.state === "new" ? 1 : 0),
          review: s.review + (current.state === "review" ? 1 : 0),
        }));
        setCards(new Map(cards).set(after.key, after));
        setCol(nextCol);
        setNow(at);
        // O mesmo cartão pode voltar em seguida (Errei sem outros na fila).
        setFace(undefined);
        setRevealed(false);
        setSaveError("");
      } catch {
        setSaveError("Não foi possível salvar a resposta neste navegador.");
      } finally {
        busy.current = false;
      }
    },
    [current, col, cards, shown],
  );

  const back = useCallback(async () => {
    const last = undo.at(-1);
    if (!last || !cards || busy.current) return;
    busy.current = true;
    try {
      await saveAnswer(last.col, last.card);
      setUndo((u) => u.slice(0, -1));
      setCards(new Map(cards).set(last.card.key, last.card));
      setCol(last.col);
      setShown(last.shown);
      setFace(undefined);
      setNow(Date.now());
    } finally {
      busy.current = false;
    }
  }, [undo, cards]);

  // Atalhos do Anki: espaço mostra a resposta, 1 a 4 respondem, Z desfaz.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          void back();
        }
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, dialog")) return;
      if (e.key.toLowerCase() === "z") void back();
      else if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        void rate(3);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key))
        void rate(Number(e.key) as Rating);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, rate, back]);

  if (col === null || (cards && !node))
    return (
      <div className="card puppy-message">
        <Thor className="puppy" mood="hopeful" size={110} />
        <div>
          <h1>Baralho não encontrado</h1>
          <p>Ele pode ter sido removido deste navegador.</p>
          <Link to="/flashcards">Voltar aos baralhos</Link>
        </div>
      </div>
    );
  if (!col || !queue || !node) return <div className="card loading">Carregando…</div>;

  const c = counts(queue);
  const ready = current && face?.key === current.key;
  const kind = current?.state === "new" ? "new" : current?.state === "review" ? "review" : "learn";
  return (
    <div className="flash-study">
      <div className="flash-top">
        <Link to="/flashcards" className="text-button">
          <ArrowLeft size={16} /> Baralhos
        </Link>
        <span className="flash-deck" title={deck.split(DECK_SEPARATOR).join(" › ")}>
          {node.label}
        </span>
        <span className="flash-counts" aria-label="Novos, aprendendo e revisões">
          <span className={`count-new${current && kind === "new" ? " current" : ""}`}>{c.fresh}</span>
          <span className={`count-learn${current && kind === "learn" ? " current" : ""}`}>{c.learn}</span>
          <span className={`count-review${current && kind === "review" ? " current" : ""}`}>{c.review}</span>
        </span>
      </div>
      {saveError && (
        <div role="alert" className="warning">
          {saveError}
        </div>
      )}
      {!current ? (
        <div className="card puppy-message flash-done">
          <Thor className="puppy" mood={queue.later.length ? "sleepy" : "proud"} size={110} />
          <div>
            {queue.later.length ? (
              <>
                <h1>Tudo em dia por agora</h1>
                <p>
                  {queue.later.length === 1
                    ? "Um cartão em aprendizado volta"
                    : `${queue.later.length} cartões em aprendizado voltam`}{" "}
                  em {formatDelay(queue.later[0].due - now)}. Pode deixar esta
                  tela aberta que ele aparece sozinho.
                </p>
              </>
            ) : (
              <>
                <h1>Parabéns! Baralho em dia.</h1>
                <p>
                  Você terminou o que tinha para hoje neste baralho. O Thor
                  ficou orgulhoso. Amanhã tem mais.
                </p>
              </>
            )}
            <div className="flash-done-actions">
              <Link className="secondary" to="/flashcards">
                Voltar aos baralhos
              </Link>
              {undo.length > 0 && (
                <button className="text-button" onClick={() => void back()}>
                  <Undo2 size={16} /> Desfazer a última
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card flash-card" aria-live="polite">
            {ready && (
              <CardFace
                html={revealed ? face.answer : face.question}
                css={face.css}
                col={col.id}
                dark={dark}
              />
            )}
          </div>
          <div className="flash-actions">
            {!revealed ? (
              <button className="primary flash-show" disabled={!ready} onClick={() => setRevealed(true)}>
                Mostrar resposta
              </button>
            ) : (
              <div className="flash-ratings">
                {ratings.map((r) => (
                  <button key={r} className={`flash-rate rate-${r}`} onClick={() => void rate(r)}>
                    <small>{formatDelay(nextDelay(current, r, now, col.conf))}</small>
                    {ratingLabels[r]}
                  </button>
                ))}
              </div>
            )}
            <button
              className="text-button flash-undo"
              disabled={!undo.length}
              onClick={() => void back()}
            >
              <Undo2 size={16} /> Desfazer
            </button>
          </div>
          <p className="flash-hint">
            Atalhos: espaço mostra a resposta, 1 a 4 respondem, Z desfaz.
          </p>
        </>
      )}
    </div>
  );
}
