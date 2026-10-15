import { examSchema, type Exam } from "../types";
import { demo } from "./demo";
// Cada prova vira um chunk separado no build e só é baixada quando o
// candidato inicia o simulado.
const sources: Record<string, () => Promise<{ default: unknown }>> = {
  "psu-mg-2024": () => import("./psu-mg/2024.json"),
  "psu-mg-2025": () => import("./psu-mg/2025.json"),
  "psu-mg-2026": () => import("./psu-mg/2026.json"),
  "santa-casa-bh-2024": () => import("./santa-casa-bh/2024.json"),
  "santa-casa-bh-2025": () => import("./santa-casa-bh/2025.json"),
  "santa-casa-bh-2026": () => import("./santa-casa-bh/2026.json"),
};
export async function loadExam(id: string): Promise<Exam> {
  if (id === demo.id) return demo;
  const source = sources[id];
  if (!source) throw Error(`Prova desconhecida: ${id}`);
  return examSchema.parse((await source()).default);
}
