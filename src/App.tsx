import { useEffect, useRef, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { GraduationCap, Sun, Moon, History } from "lucide-react";
import { exams } from "./data/catalog";
import type { Attempt, Store } from "./types";
import { createAttempt, settle, pause } from "./services/session";
import {
  decodeStore,
  recover,
  save,
  upsert,
  STORAGE_KEY,
} from "./services/storage";
import { Home } from "./pages/Home";
import { Simulation } from "./pages/Simulation";
import { Results } from "./pages/Results";
import { HistoryPage } from "./pages/HistoryPage";
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
  function start(examId: string) {
    if (error) return;
    const exam = exams.find((e) => e.id === examId);
    if (
      !exam?.questions.length ||
      exam.questions.some((q) => q.review !== "approved")
    )
      return;
    const a = createAttempt(exam, Date.now());
    persist(upsert(ref.current, a));
    nav(`/simulado/${a.id}`);
  }
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <GraduationCap size={25} />
          </span>
          <span>
            residência<span className="brand-sub">SIMULADOR DE PROVAS</span>
          </span>
        </Link>
        <nav>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Simulados
          </Link>
          <Link to="/historico">
            <History size={17} /> <span>Histórico</span>
          </Link>
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
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <Home attempts={store.attempts} start={start} blocked={!!error} />
            }
          />
          <Route
            path="/simulado/:id"
            element={<Simulation attempts={store.attempts} update={update} />}
          />
          <Route
            path="/resultado/:id"
            element={<Results attempts={store.attempts} start={start} />}
          />
          <Route
            path="/historico"
            element={
              <HistoryPage
                attempts={store.attempts}
                start={start}
                exportData={() =>
                  download(
                    JSON.stringify(ref.current, null, 2),
                    "residencia-historico.json",
                  )
                }
              />
            }
          />
          <Route
            path="*"
            element={
              <div className="card">
                <h1>Página não encontrada</h1>
                <Link to="/">Voltar ao início</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        Feito para a sua próxima etapa.{" "}
        <span>Dados salvos neste navegador · sem conta ou servidor</span>
      </footer>
    </>
  );
}
