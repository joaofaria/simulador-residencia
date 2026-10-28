import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { loadMedia } from "./db";

// O HTML do cartão vem do baralho de quem importou. Ele passa pelo DOMPurify
// (sem scripts nem eventos) e é desenhado num shadow DOM, para o CSS do
// modelo, que costuma mexer em .card, não vazar para o resto do site.
const base = `
:host { display: block; }
.card { font-size: 18px; line-height: 1.5; padding: 4px; overflow-wrap: anywhere; }
.card img { max-width: 100%; height: auto; }
.card hr#answer { border: 0; border-top: 1px solid var(--border, #dae4f2); margin: 18px 0; }
.card table { border-collapse: collapse; max-width: 100%; }
.card details.hint summary { color: var(--accent, #1d5fc4); cursor: pointer; }
`;
// No modo escuro o fundo e a cor do texto seguem o site, mesmo que o modelo
// fixe fundo branco.
const night = `
.card.nightMode { background-color: transparent !important; color: var(--ink, #e9eff8) !important; }
`;

const LOCAL = /^(?!https?:|data:|blob:|\/\/)/i;

export function CardFace({ html, css, col, dark }: {
  html: string;
  css: string;
  col: string;
  dark: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const root = el.shadowRoot ?? el.attachShadow({ mode: "open" });
    const clean = DOMPurify.sanitize(html, { FORCE_BODY: true });
    root.innerHTML = `<style>${base}${css}${night}</style><div class="card${
      dark ? " nightMode night_mode" : ""
    }">${clean}</div>`;
    root.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
    // Figuras que vieram dentro do .apkg ficam no navegador; troca o nome do
    // arquivo pelo endereço local.
    const urls: string[] = [];
    let alive = true;
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || !LOCAL.test(src)) return;
      img.removeAttribute("src");
      let name = src;
      try {
        name = decodeURIComponent(src);
      } catch {
        /* Nome com % solto: usa como está. */
      }
      void loadMedia(col, name).then((blob) => {
        if (!blob || !alive) return;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        img.src = url;
      });
    });
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [html, css, col, dark]);
  return <div ref={host} className="flash-face" />;
}
