// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../App";
import { STORAGE_KEY } from "../services/storage";

beforeAll(() => {
  // O jsdom não implementa <dialog>, scrollIntoView nem ResizeObserver.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  Element.prototype.scrollIntoView = () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function setup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  return user;
}

async function startDemo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Testar simulador/ }));
  await screen.findByRole("heading", { name: "Conheça o simulador" });
}

function alternative(letter: string) {
  const found = [
    ...document.querySelectorAll<HTMLButtonElement>(".alternatives button"),
  ].find((b) => b.querySelector(".letter")?.textContent === letter);
  if (!found) throw new Error(`Alternativa ${letter} não encontrada`);
  return found;
}

describe("Tela de prova", () => {
  it("inicia o simulado na primeira questão", async () => {
    const user = setup();
    await startDemo(user);
    expect(screen.getByText("QUESTÃO 1")).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("0 de 3 respondidas")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /^Anterior$/ })
        .hasAttribute("disabled"),
    ).toBe(true);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.attempts[0].status).toBe("running");
  });

  it("marca, troca e limpa a resposta", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(alternative("A"));
    expect(alternative("A").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("1 de 3 respondidas")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Questão 1, respondida" }),
    ).toBeTruthy();

    await user.click(alternative("B"));
    expect(alternative("B").getAttribute("aria-pressed")).toBe("true");
    expect(alternative("A").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("1 de 3 respondidas")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Limpar resposta" }));
    expect(screen.getByText("0 de 3 respondidas")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Questão 1, não respondida" }),
    ).toBeTruthy();
  });

  it("navega com Próxima, Anterior e o mapa de questões", async () => {
    const user = setup();
    await startDemo(user);
    const next = () => screen.getByRole("button", { name: /^Próxima$/ });
    const previous = () => screen.getByRole("button", { name: /^Anterior$/ });

    await user.click(next());
    expect(screen.getByText("QUESTÃO 2")).toBeTruthy();
    expect(screen.getByText("2 / 3")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^Questão 3,/ }));
    expect(screen.getByText("QUESTÃO 3")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Próxima$/ })).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Finalizar simulado" }),
    ).toHaveLength(2);
    expect(
      screen
        .getByRole("button", { name: /^Questão 3,/ })
        .getAttribute("aria-current"),
    ).toBe("step");

    await user.click(previous());
    await user.click(previous());
    expect(screen.getByText("QUESTÃO 1")).toBeTruthy();
    expect(previous().hasAttribute("disabled")).toBe(true);
  });

  it("na última questão o botão vira Finalizar simulado e pede confirmação", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(screen.getByRole("button", { name: /^Questão 3,/ }));
    const footer = screen.getByText("3 / 3").parentElement!;
    await user.click(
      within(footer).getByRole("button", { name: "Finalizar simulado" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Finalizar seu simulado?" }),
    ).toBeTruthy();
  });

  it("avisa quando a questão foi anulada", async () => {
    const user = setup();
    await startDemo(user);
    expect(screen.queryByText(/foi anulada pela banca/)).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Questão 2,/ }));
    expect(screen.getByText(/foi anulada pela banca/)).toBeTruthy();
  });

  it("não fala em questões em branco quando todas foram respondidas", async () => {
    const user = setup();
    await startDemo(user);
    for (const n of [1, 2, 3]) {
      await user.click(
        screen.getByRole("button", { name: new RegExp(`^Questão ${n},`) }),
      );
      await user.click(alternative("A"));
    }
    await user.click(
      screen.getAllByRole("button", { name: "Finalizar simulado" })[0],
    );
    const dialog = screen.getByRole("dialog", {
      name: "Finalizar seu simulado?",
    });
    expect(
      within(dialog).getByText(/Você respondeu todas as questões/),
    ).toBeTruthy();
    expect(within(dialog).queryByText(/em branco/)).toBeNull();
  });

  it("mantém a resposta ao sair e voltar para a questão", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(alternative("A"));
    await user.click(screen.getByRole("button", { name: /^Questão 2,/ }));
    await user.click(screen.getByRole("button", { name: /^Questão 1,/ }));
    expect(alternative("A").getAttribute("aria-pressed")).toBe("true");
  });

  it("pede confirmação e permite continuar respondendo", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(
      screen.getByRole("button", { name: "Finalizar simulado" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Finalizar seu simulado?",
    });
    expect(
      within(dialog).getByText(/3 questões ainda estão em branco/),
    ).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: "Continuar respondendo" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("QUESTÃO 1")).toBeTruthy();
  });

  it("finaliza e mostra a pontuação com acerto", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(alternative("A"));
    await user.click(screen.getByRole("button", { name: /^Próxima$/ }));
    await user.click(alternative("A"));
    await user.click(
      screen.getByRole("button", { name: "Finalizar simulado" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/1 questão ainda está em branco/),
    ).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar finalização" }),
    );

    await screen.findByRole("heading", { name: "Seu desempenho" });
    expect(screen.getByText("100.0%")).toBeTruthy();
    expect(
      screen.getByText("1 acertos em 1 questões válidas com gabarito."),
    ).toBeTruthy();
    expect(screen.getByText(/1 questões sem gabarito verificado/)).toBeTruthy();
    const stat = (label: string) =>
      [...document.querySelectorAll(".stat")]
        .find((card) => card.querySelector("small")?.textContent === label)
        ?.querySelector("strong")?.textContent;
    expect(stat("Total de questões")).toBe("3");
    expect(stat("Acertos")).toBe("1");
    expect(stat("Erros")).toBe("0");
    expect(stat("Anuladas")).toBe("1");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.attempts[0].status).toBe("finished");
    expect(stored.attempts[0].result.percentage).toBe(100);
  });

  it("conta erro e questão em branco como não acertadas", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(alternative("B"));
    await user.click(
      screen.getByRole("button", { name: "Finalizar simulado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar finalização" }),
    );
    await screen.findByRole("heading", { name: "Seu desempenho" });
    expect(screen.getByText("0.0%")).toBeTruthy();
    expect(
      screen.getByText("0 acertos em 1 questões válidas com gabarito."),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Incorreta" }));
    expect(screen.getByRole("heading", { name: "Questão 1" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Questão 2" })).toBeNull();
    expect(screen.getByText(/Sua resposta: B · Gabarito: A/)).toBeTruthy();
  });

  it("não deixa alterar respostas depois de finalizar", async () => {
    const user = setup();
    await startDemo(user);
    await user.click(
      screen.getByRole("button", { name: "Finalizar simulado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar finalização" }),
    );
    await screen.findByRole("heading", { name: "Seu desempenho" });
    const options = document.querySelectorAll(".alternatives button");
    expect(options.length).toBeGreaterThan(0);
    options.forEach((b) => expect(b.hasAttribute("disabled")).toBe(true));
  });
});
