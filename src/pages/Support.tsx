import { useRef, useState } from "react";
import { Check, Copy, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import qr from "../assets/pix-qr.svg";
import { pixPayload } from "../services/pix";
import { Thor } from "../components/Thor";

// Página de contribuição voluntária. Fica fora da prova: só o rodapé e a tela
// de resultado apontam para cá.
export function Support() {
  const code = pixPayload();
  const field = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Sem acesso à área de transferência, deixa o código selecionado.
      field.current?.select();
    }
  }
  return (
    <div className="card support">
      <div className="puppy-message">
        <Thor className="puppy" mood="happy" size={110} />
        <div>
          <h1>Apoie o ResidênCão</h1>
          <p>
            O simulador é gratuito e continua assim. Se ele te ajudou e você
            quiser retribuir, qualquer valor por Pix ajuda a manter tudo no ar
            (e garante uns petiscos para o Thor). Se não der agora, tudo bem: a
            sua aprovação já é o melhor presente.
          </p>
        </div>
      </div>
      <div className="pix">
        <img src={qr} alt="QR code do Pix" width={200} height={200} />
        <div>
          <p>
            Aponte a câmera do app do banco para o QR code ou copie o código
            abaixo e cole em <strong>Pix copia e cola</strong>. Você escolhe o
            valor.
          </p>
          <textarea
            ref={field}
            readOnly
            rows={4}
            value={code}
            aria-label="Código Pix copia e cola"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button className="primary" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
          <small>Recebedor: João Vitor Pedrosa Faria</small>
        </div>
      </div>
      <p className="support-thanks">
        <Heart size={14} /> Obrigado de coração, e boa prova!{" "}
        <Link to="/">Voltar aos simulados</Link>
      </p>
    </div>
  );
}
