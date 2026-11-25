import { useState, type FormEvent } from "react";
import { Cloud, LogOut, RefreshCw } from "lucide-react";
import { Thor } from "../components/Thor";
import { AuthError } from "../services/sync";
import type { SyncState } from "../services/useSync";

const hour = (d: Date) =>
  d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Entrar na conta para levar o histórico, a prova em andamento e as marcas do
// cronograma para outro navegador. Os flashcards ficam só neste navegador.
export function Account({ sync }: { sync: SyncState }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setProblem("");
    try {
      await sync.signIn(email, password);
      setPassword("");
    } catch (err) {
      setProblem(
        err instanceof AuthError
          ? err.message
          : "Não foi possível entrar agora. Verifique a conexão e tente de novo.",
      );
    } finally {
      setSending(false);
    }
  }

  if (!sync.available)
    return (
      <div className="card puppy-message">
        <Thor className="puppy" mood="hopeful" size={110} />
        <div>
          <h1>Conta</h1>
          <p>
            A sincronização entre navegadores ainda não foi ligada neste site.
            Seus dados continuam salvos neste navegador.
          </p>
        </div>
      </div>
    );

  if (sync.email)
    return (
      <div className="card account">
        <div className="puppy-message">
          <Thor className="puppy" mood="happy" size={110} />
          <div>
            <h1>Sua conta</h1>
            <p>
              Conectado como <strong>{sync.email}</strong>. O histórico de
              simulados, a prova em andamento, as alternativas riscadas e as
              marcas do cronograma do IPSEMG vão para a conta e se juntam ao
              que você fez em outros navegadores. Os flashcards continuam só
              neste navegador.
            </p>
          </div>
        </div>
        <p className="account-status" role="status">
          <Cloud size={16} />{" "}
          {sync.busy
            ? "Sincronizando…"
            : sync.error
              ? sync.error
              : sync.last
                ? `Tudo sincronizado às ${hour(sync.last)}.`
                : "Aguardando a primeira sincronização."}
        </p>
        <p className="account-note">
          Uma prova aberta sobe para a conta quando você pausa, sai dela ou
          termina.
        </p>
        <div className="account-actions">
          <button className="primary" disabled={sync.busy} onClick={sync.now}>
            <RefreshCw size={16} /> Sincronizar agora
          </button>
          <button className="secondary" onClick={sync.signOut}>
            <LogOut size={16} /> Sair
          </button>
        </div>
        <p className="account-note">
          Ao sair, nada é apagado deste navegador: ele só para de sincronizar.
        </p>
      </div>
    );

  return (
    <div className="card account">
      <div className="puppy-message">
        <Thor className="puppy" mood="hopeful" size={110} />
        <div>
          <h1>Entrar</h1>
          <p>
            Com a conta, o histórico de simulados, a prova em andamento e as
            marcas do cronograma do IPSEMG ficam iguais em todos os navegadores
            onde você entrar. O que já está salvo aqui não se perde: soma com o
            que já está na conta. Sem entrar, o site continua funcionando como
            sempre.
          </p>
        </div>
      </div>
      <form className="account-form" onSubmit={submit}>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {(problem || sync.error) && (
          <p role="alert" className="account-error">
            {problem || sync.error}
          </p>
        )}
        <button className="primary" type="submit" disabled={sending}>
          {sending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
