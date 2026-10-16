import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Thor } from "./Thor";

// Convite discreto para a contribuição por Pix, na página inicial e no
// resultado. Nunca aparece durante a prova.
export function SupportCard() {
  return (
    <section className="card support-link">
      <Thor mood="happy" size={64} />
      <div>
        <h3>Gostou do ResidênCão?</h3>
        <p>
          O simulador é gratuito e vai continuar assim. Se ele te ajudou e você
          quiser retribuir, dá para mandar qualquer valor por Pix, que ajuda a
          manter o site no ar e garante uns petiscos para o Thor.
        </p>
      </div>
      <Link className="secondary" to="/apoie">
        <Heart size={16} /> Apoiar com Pix
      </Link>
    </section>
  );
}
