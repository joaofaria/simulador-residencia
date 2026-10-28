// Contador de visitas do GoatCounter (sem cookies). O código é o subdomínio da
// conta, e o painel fica em https://residencao.goatcounter.com.
// Com o código vazio, nada é carregado nem contado.
export const GOATCOUNTER_CODE: string = "residencao";

type GoatCounter = {
  count: (vars: { path: string; title?: string }) => void;
};
declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

// O HashRouter deixa o pathname real sempre igual; a página vem do hash.
// Os ids de tentativa e de baralho viram uma página só, para não espalhar a
// contagem (e o nome do baralho de ninguém sai do navegador).
export function pagePath(route: string) {
  return route
    .replace(/^\/(simulado|resultado)\/.+$/, "/$1")
    .replace(/^\/flashcards\/.+$/, "/flashcards/estudo");
}

export function enabled(host = location.hostname) {
  return (
    import.meta.env.PROD &&
    GOATCOUNTER_CODE !== "" &&
    host !== "localhost" &&
    host !== "127.0.0.1"
  );
}

let loading: Promise<GoatCounter | undefined> | undefined;
function load() {
  loading ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    // A contagem automática usaria só o pathname; quem conta é countVisit.
    s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
    s.onload = () => resolve(window.goatcounter);
    s.onerror = () => resolve(undefined);
    document.head.appendChild(s);
  });
  return loading;
}

export function countVisit(route: string) {
  if (!enabled()) return;
  const path = pagePath(route);
  void load().then((gc) => gc?.count({ path, title: document.title }));
}
