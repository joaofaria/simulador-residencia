import { Link } from "react-router-dom";
export function Missing() {
  return (
    <div className="card">
      <h1>Tentativa não encontrada</h1>
      <p>O histórico é local a este navegador.</p>
      <Link to="/">Voltar ao início</Link>
    </div>
  );
}
