import { Link } from "react-router-dom";
import { Puppy } from "./Puppy";
export function Missing() {
  return (
    <div className="card puppy-message">
      <Puppy className="puppy" mood="sleepy" coat="cream" size={110} />
      <div>
        <h1>Tentativa não encontrada</h1>
        <p>O histórico é local a este navegador.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    </div>
  );
}
