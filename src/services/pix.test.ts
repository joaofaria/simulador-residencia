import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { crc16, pixPayload } from "./pix";
import { pixSvg } from "../../scripts/pix-qr";

describe("pix", () => {
  it("calcula o CRC16-CCITT do padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("monta o BR Code estático sem valor", () => {
    // Conferido com o pix-utils, que valida a estrutura e o CRC.
    expect(pixPayload()).toBe(
      "00020126580014br.gov.bcb.pix0136726c4fe3-0533-495f-9fb4-7c00a8dfe7b75204000053039865802BR5924Joao Vitor Pedrosa Faria6006BRASIL62070503***630416D9",
    );
  });
  it("tira acentos e respeita o tamanho dos campos", () => {
    const p = pixPayload(
      "chave",
      "João Vitor Pedrosa Faria da Silva",
      "São João del-Rei",
    );
    expect(p).toContain("5925Joao Vitor Pedrosa Faria ");
    expect(p).toContain("6015Sao Joao del-Re");
  });
  it("mantém o QR salvo igual ao código", async () => {
    const saved = readFileSync(
      new URL("../assets/pix-qr.svg", import.meta.url),
      "utf8",
    );
    expect(saved).toBe(await pixSvg());
  });
});
