import { describe, expect, it } from "vitest";
import { enabled, pagePath } from "./visits";

describe("contador de visitas", () => {
  it("junta as tentativas numa página só", () => {
    expect(pagePath("/simulado/abc-123")).toBe("/simulado");
    expect(pagePath("/resultado/abc-123")).toBe("/resultado");
    expect(pagePath("/historico")).toBe("/historico");
    expect(pagePath("/")).toBe("/");
  });
  it("não conta fora do build de produção", () => {
    expect(enabled("joaofaria.github.io")).toBe(false);
  });
});
