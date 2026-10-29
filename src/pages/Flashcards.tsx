import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Layers,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { Thor } from "../components/Thor";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  deleteCollection,
  listCollections,
  loadCards,
  saveCollection,
} from "../flashcards/db";
import {
  buildQueue,
  counts,
  deckTree,
  type DeckNode,
} from "../flashcards/scheduler";
import type { Card, Collection } from "../flashcards/types";
import { isOutdated, OFFICIAL_ID, syncOfficial } from "../flashcards/official";
import type { WorkerMessage, WorkerRequest } from "../flashcards/worker";

export function studyPath(col: string, deck: string) {
  return `/flashcards/${col}/${encodeURIComponent(deck)}`;
}

type Importing = { stage: "reading" | "saving"; fraction: number; name: string };

export function Flashcards() {
  const [collections, setCollections] = useState<Collection[]>();
  const [importing, setImporting] = useState<Importing>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [skipImages, setSkipImages] = useState(true);
  const [generating, setGenerating] = useState(false);
  async function refresh() {
    try {
      let all = await listCollections();
      // Se o formato dos cards das provas mudou, refaz o texto (o progresso fica).
      if (all.some((c) => c.source === "provas" && isOutdated(c))) {
        await syncOfficial().catch(() => {});
        all = await listCollections();
      }
      // As provas oficiais vêm primeiro, depois os baralhos importados.
      setCollections(
        all.sort(
          (a, b) => Number(b.source === "provas") - Number(a.source === "provas"),
        ),
      );
    } catch {
      setCollections([]);
      setError(
        "Este navegador não deixou o site guardar baralhos. Numa janela anônima isso pode acontecer.",
      );
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  function importFile(file: File) {
    setError("");
    setMessage("");
    setImporting({ stage: "reading", fraction: 0, name: file.name });
    const worker = new Worker(new URL("../flashcards/worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const m = e.data;
      if (m.kind === "progress") {
        setImporting({ stage: m.stage, fraction: m.fraction, name: file.name });
        return;
      }
      worker.terminate();
      setImporting(undefined);
      if (m.kind === "error") setError(m.message);
      else
        setMessage(
          `${m.name} importado: ${m.cards.toLocaleString("pt-BR")} cartões prontos para estudar.` +
            (m.skipped
              ? ` ${m.skipped.toLocaleString("pt-BR")} ficaram de fora porque as imagens deles não vêm dentro do arquivo.`
              : ""),
        );
      void refresh();
    };
    worker.onerror = () => {
      worker.terminate();
      setImporting(undefined);
      setError("Não foi possível importar este arquivo.");
    };
    const request: WorkerRequest = { file, skipUnavailableImages: skipImages };
    worker.postMessage(request);
  }
  // Cria os cards das provas ou acrescenta as questões que entraram depois.
  async function generate() {
    setError("");
    setMessage("");
    setGenerating(true);
    try {
      const { added, total } = await syncOfficial();
      setMessage(
        added
          ? `${added.toLocaleString("pt-BR")} cards novos das provas. Agora são ${total.toLocaleString("pt-BR")}.`
          : "Os cards das provas já estão todos aí.",
      );
    } catch {
      setError("Não foi possível gerar os cards das provas. Verifique a conexão e tente de novo.");
    } finally {
      setGenerating(false);
      void refresh();
    }
  }
  return (
    <>
      <section className="card puppy-message flash-intro">
        <Thor className="puppy" mood="happy" size={96} />
        <div>
          <h1>Flashcards</h1>
          <p>
            Importe um baralho do Anki (.apkg) e estude com a mesma revisão
            espaçada: veja a pergunta, mostre a resposta e diga como foi. O
            arquivo é lido e guardado só neste navegador, nada vai para a
            internet.
          </p>
          <label className="skip-images">
            <input
              type="checkbox"
              checked={skipImages}
              onChange={(e) => setSkipImages(e.target.checked)}
            />
            Pular cartões com imagem que não vem dentro do arquivo
          </label>
          <label className={`primary file-button${importing ? " disabled" : ""}`}>
            <Upload size={17} /> Importar baralho .apkg
            <input
              type="file"
              accept=".apkg"
              disabled={!!importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) importFile(file);
              }}
            />
          </label>
        </div>
      </section>
      {importing && (
        <div className="card flash-progress" role="status">
          <p>
            {importing.stage === "reading"
              ? `Abrindo ${importing.name}…`
              : `Guardando os cartões… ${Math.round(importing.fraction * 100)}%`}
          </p>
          <div className="progress">
            <div
              style={{
                width: `${importing.stage === "reading" ? 5 : Math.max(5, importing.fraction * 100)}%`,
              }}
            />
          </div>
          <small>Baralhos grandes levam alguns segundos. Pode deixar a aba aberta.</small>
        </div>
      )}
      {error && (
        <div role="alert" className="warning">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="flash-ok">
          {message}
        </div>
      )}
      {collections && !collections.some((c) => c.id === OFFICIAL_ID) && (
        <section className="card flash-official">
          <span className="small-icon">
            <BookOpen size={22} />
          </span>
          <div>
            <h2>Provas oficiais</h2>
            <p>
              Transforme as questões do simulador em cards: a frente é a
              questão, sem as alternativas, e o verso traz a resposta certa. Ficam
              separados por área e prova, e só entram as que têm gabarito.
            </p>
          </div>
          <button className="primary" disabled={generating} onClick={() => void generate()}>
            {generating ? "Gerando…" : "Gerar cards das provas"}
          </button>
        </section>
      )}
      {collections?.map((c) => (
        <CollectionCard
          key={c.id}
          col={c}
          refresh={refresh}
          update={c.source === "provas" ? generate : undefined}
          updating={generating}
        />
      ))}
      {collections && !collections.length && !importing && (
        <div className="empty">
          <Thor className="puppy" mood="sleepy" size={72} />
          <div>
            <h3>Nenhum baralho por aqui ainda</h3>
            <p>
              No Anki, use Arquivo › Exportar, escolha "Pacote de baralho do
              Anki (.apkg)" e importe o arquivo aqui.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function CollectionCard({ col, refresh, update, updating }: {
  col: Collection;
  refresh: () => void;
  update?: () => void;
  updating?: boolean;
}) {
  const [cards, setCards] = useState<Card[]>();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState(false);
  const [removing, setRemoving] = useState(false);
  useEffect(() => {
    void loadCards(col.id).then(setCards);
  }, [col.id]);
  const tree = useMemo(() => (cards ? deckTree(cards) : []), [cards]);
  const now = Date.now();
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  return (
    <section className="card flash-collection">
      <div className="flash-collection-head">
        <span className="small-icon">
          {col.source === "provas" ? <BookOpen size={22} /> : <Layers size={22} />}
        </span>
        <div>
          <h2>{col.name}</h2>
          <p>
            {col.cardCount.toLocaleString("pt-BR")} cartões · até{" "}
            {col.conf.newPerDay} novos e {col.conf.reviewsPerDay} revisões por
            dia
          </p>
        </div>
        {update && (
          <button
            className="icon-button"
            aria-label="Atualizar com as questões novas do banco"
            title="Atualizar com as questões novas do banco"
            disabled={updating}
            onClick={update}
          >
            <RefreshCw size={18} />
          </button>
        )}
        <button className="icon-button" aria-label="Opções do baralho" onClick={() => setOptions(true)}>
          <Settings size={18} />
        </button>
        <button className="icon-button" aria-label="Remover baralho" onClick={() => setRemoving(true)}>
          <Trash2 size={18} />
        </button>
      </div>
      {!cards ? (
        <p className="muted">Carregando…</p>
      ) : (
        <table className="deck-table">
          <thead>
            <tr>
              <th>Baralho</th>
              <th>Novos</th>
              <th>Aprender</th>
              <th>Revisar</th>
            </tr>
          </thead>
          <tbody>
            {tree.map((n) => (
              <DeckRows key={n.name} node={n} depth={0} col={col} now={now} open={open} toggle={toggle} rootOpen />
            ))}
          </tbody>
        </table>
      )}
      {options && (
        <OptionsDialog
          col={col}
          onClose={() => setOptions(false)}
          onSave={async (next) => {
            await saveCollection(next);
            setOptions(false);
            refresh();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog title="Remover este baralho?" onClose={() => setRemoving(false)}>
          <p>
            {col.name} e todo o progresso dele saem deste navegador.{" "}
            {col.source === "provas"
              ? "Dá para gerar os cards de novo, mas o progresso não volta."
              : "Para estudar de novo, será preciso importar o arquivo outra vez."}
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setRemoving(false)}>
              Cancelar
            </button>
            <button
              className="primary"
              onClick={async () => {
                await deleteCollection(col.id);
                setRemoving(false);
                refresh();
              }}
            >
              Remover
            </button>
          </div>
        </ConfirmDialog>
      )}
    </section>
  );
}

function DeckRows({ node, depth, col, now, open, toggle, rootOpen = false }: {
  node: DeckNode;
  depth: number;
  col: Collection;
  now: number;
  open: Set<string>;
  toggle: (name: string) => void;
  rootOpen?: boolean;
}) {
  const c = counts(buildQueue(node, col, now));
  // A raiz começa aberta; clicar nela inverte.
  const expanded = rootOpen ? !open.has(node.name) : open.has(node.name);
  return (
    <>
      <tr>
        <td>
          <span className="deck-name" style={{ paddingLeft: depth * 18 }}>
            {node.children.length ? (
              <button
                className="deck-toggle"
                aria-label={expanded ? `Fechar ${node.label}` : `Abrir ${node.label}`}
                aria-expanded={expanded}
                onClick={() => toggle(node.name)}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="deck-toggle" />
            )}
            <Link to={studyPath(col.id, node.name)}>{node.label}</Link>
          </span>
        </td>
        <td className={c.fresh ? "count-new" : "count-zero"}>{c.fresh}</td>
        <td className={c.learn ? "count-learn" : "count-zero"}>{c.learn}</td>
        <td className={c.review ? "count-review" : "count-zero"}>{c.review}</td>
      </tr>
      {expanded &&
        node.children.map((child) => (
          <DeckRows key={child.name} node={child} depth={depth + 1} col={col} now={now} open={open} toggle={toggle} />
        ))}
    </>
  );
}

function OptionsDialog({ col, onClose, onSave }: {
  col: Collection;
  onClose: () => void;
  onSave: (next: Collection) => void;
}) {
  const [fresh, setFresh] = useState(String(col.conf.newPerDay));
  const [reviews, setReviews] = useState(String(col.conf.reviewsPerDay));
  const valid = (v: string) => /^\d{1,5}$/.test(v);
  return (
    <ConfirmDialog title="Limites por dia" onClose={onClose}>
      <p>
        Valem para cada baralho e subbaralho, como no Anki. Começar com poucos
        cartões novos por dia evita uma pilha grande de revisões depois.
      </p>
      <div className="fields flash-fields">
        <label>
          Cartões novos por dia
          <input inputMode="numeric" value={fresh} onChange={(e) => setFresh(e.target.value)} />
        </label>
        <label>
          Revisões por dia
          <input inputMode="numeric" value={reviews} onChange={(e) => setReviews(e.target.value)} />
        </label>
      </div>
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="primary"
          disabled={!valid(fresh) || !valid(reviews)}
          onClick={() =>
            onSave({
              ...col,
              conf: { ...col.conf, newPerDay: Number(fresh), reviewsPerDay: Number(reviews) },
            })
          }
        >
          Salvar
        </button>
      </div>
    </ConfirmDialog>
  );
}
