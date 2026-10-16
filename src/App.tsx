import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Sun, Moon, History, PawPrint, Heart } from "lucide-react";
import { loadExam, loadRealExams } from "./data/load";
import { buildRandomExam, type RandomConfig } from "./services/random";
import type { Attempt, Exam, Store } from "./types";
import { createAttempt, settle, pause } from "./services/session";
import {
  decodeStore,
  recover,
  save,
  upsert,
  STORAGE_KEY,
} from "./services/storage";
import { countVisit } from "./services/visits";
import { Home } from "./pages/Home";
import { Thor } from "./components/Thor";
// Telas fora da página inicial carregam sob demanda; Results traz o recharts.
const Simulation = lazy(() =>
  import("./pages/Simulation").then((m) => ({ default: m.Simulation })),
);
const Results = lazy(() =>
  import("./pages/Results").then((m) => ({ default: m.Results })),
);
const Support = lazy(() =>
  import("./pages/Support").then((m) => ({ default: m.Support })),
);
const HistoryPage = lazy(() =>
  import("./pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
function download(raw: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function App() {
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const starting = useRef(false);
  const [store, setStore] = useState<Store>(() => {
    try {
      return recover(decodeStore(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return { version: 2, attempts: [] };
    }
  });
  const ref = useRef(store);
  const location = useLocation();
  const nav = useNavigate();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("residencia.theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      decodeStore(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível recuperar o histórico.",
      );
    }
  }, []);
  function persist(next: Store) {
    ref.current = next;
    setStore(next);
    if (!error)
      try {
        save(next);
      } catch {
        setError(
          "Não foi possível salvar. Exporte uma cópia dos dados; o armazenamento pode estar cheio.",
        );
      }
  }
  function update(id: string, fn: (a: Attempt) => Attempt) {
    const a = ref.current.attempts.find((x) => x.id === id);
    if (a) persist(upsert(ref.current, fn(a)));
  }
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("residencia.theme", dark ? "dark" : "light");
    } catch {
      /* A interface permanece disponível sem persistência do tema. */
    }
  }, [dark]);
  useEffect(() => {
    countVisit(location.pathname);
  }, [location.pathname]);
  useEffect(() => {
    const leaving = ref.current.attempts.filter(
      (a) =>
        a.status === "running" && location.pathname !== `/simulado/${a.id}`,
    );
    if (leaving.length) {
      let next = ref.current;
      leaving.forEach((a) => {
        next = upsert(next, pause(a, Date.now()));
      });
      persist(next);
    }
  }, [location.pathname]);
  useEffect(() => {
    const stop = () => {
      let next = ref.current;
      next.attempts
        .filter((a) => a.status === "running")
        .forEach((a) => {
          next = upsert(next, pause(a, Date.now()));
        });
      persist(next);
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", stop);
    const timer = setInterval(() => {
      if (!document.hidden) {
        const running = ref.current.attempts.find(
          (a) => a.status === "running",
        );
        if (running) update(running.id, (a) => settle(a, Date.now()));
      }
    }, 1000);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", stop);
    };
  }, [error]);
  // Abre uma tentativa nova com a prova que `get` devolver. Uma chamada por vez.
  async function begin(get: () => Promise<Exam>, failure: string) {
    if (error || starting.current) return;
    starting.current = true;
    setLoadError("");
    try {
      const exam = await get();
      if (
        !exam.questions.length ||
        exam.questions.some((q) => q.review !== "approved")
      )
        return;
      const a = createAttempt(exam, Date.now());
      persist(upsert(ref.current, a));
      nav(`/simulado/${a.id}`);
    } catch {
      setLoadError(failure);
    } finally {
      starting.current = false;
    }
  }
  const loadFailure =
    "Não foi possível carregar a prova. Verifique a conexão e tente de novo.";
  function start(examId: string) {
    return begin(() => loadExam(examId), loadFailure);
  }
  function startRandom(config: RandomConfig) {
    return begin(
      async () => buildRandomExam(await loadRealExams(), config),
      "Não foi possível montar a prova aleatória. Verifique a conexão e tente de novo.",
    );
  }
  // Refazer uma prova aleatória repete as mesmas questões, na mesma ordem.
  function retry(a: Attempt) {
    return a.exam.random
      ? begin(async () => a.exam, loadFailure)
      : start(a.exam.id);
  }
  // A contribuição nunca aparece durante a prova.
  const inExam = location.pathname.startsWith("/simulado/");
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Thor size={50} />
          </span>
          <span>
            ResidênCão<span className="brand-sub">SIMULADOR DE PROVAS</span>
          </span>
        </Link>
        <nav>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Simulados
          </Link>
          <Link to="/historico">
            <History size={17} /> <span>Histórico</span>
          </Link>
          {!inExam && (
            <Link
              to="/apoie"
              className={`support-nav${location.pathname === "/apoie" ? " active" : ""}`}
              aria-label="Apoie com Pix"
            >
              <Heart size={16} /> <span>Apoie</span>
            </Link>
          )}
          <button
            className="icon-button"
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </nav>
      </header>
      {error && (
        <div role="alert" className="warning">
          {error}{" "}
          <button
            onClick={() =>
              download(
                localStorage.getItem(STORAGE_KEY) ?? "{}",
                "historico-original.json",
              )
            }
          >
            Exportar dados originais
          </button>
        </div>
      )}
      {loadError && (
        <div role="alert" className="warning">
          {loadError}
        </div>
      )}
      <main>
        <Suspense
          fallback={
            <div className="card loading">
              <PawPrint size={20} /> Carregando…
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  attempts={store.attempts}
                  start={start}
                  startRandom={startRandom}
                  blocked={!!error}
                />
              }
            />
            <Route
              path="/simulado/:id"
              element={<Simulation attempts={store.attempts} update={update} />}
            />
            <Route
              path="/resultado/:id"
              element={<Results attempts={store.attempts} retry={retry} />}
            />
            <Route
              path="/historico"
              element={
                <HistoryPage
                  attempts={store.attempts}
                  retry={retry}
                  exportData={() =>
                    download(
                      JSON.stringify(ref.current, null, 2),
                      "residencia-historico.json",
                    )
                  }
                />
              }
            />
            <Route path="/apoie" element={<Support />} />
            <Route
              path="*"
              element={
                <div className="card puppy-message">
                  <Thor className="puppy" mood="hopeful" size={110} />
                  <div>
                    <h1>Página não encontrada</h1>
                    <p>O Thor farejou tudo e não achou nada por aqui.</p>
                    <Link to="/">Voltar ao início</Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <footer>
        Feito com carinho (e as patinhas do Thor) para a sua próxima etapa.{" "}
        <span>
          Dados salvos neste navegador · sem conta ou servidor
          {!inExam && (
            <>
              {" · "}
              <Link className="footer-pix" to="/apoie">
                Apoie com Pix
              </Link>
            </>
          )}
        </span>
      </footer>
    </>
  );
}
