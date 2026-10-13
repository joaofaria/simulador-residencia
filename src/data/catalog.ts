import psu_mg_2024 from "./psu-mg/2024.json";
import santa_casa_bh_2024 from "./santa-casa-bh/2024.json";
import psu_mg_2025 from "./psu-mg/2025.json";
import santa_casa_bh_2025 from "./santa-casa-bh/2025.json";
import psu_mg_2026 from "./psu-mg/2026.json";
import santa_casa_bh_2026 from "./santa-casa-bh/2026.json";
import { examSchema } from "../types";
import { demo } from "./demo";
export const exams = [
  ...examSchema
    .array()
    .parse([
      psu_mg_2024,
      santa_casa_bh_2024,
      psu_mg_2025,
      santa_casa_bh_2025,
      psu_mg_2026,
      santa_casa_bh_2026,
    ]),
  demo,
];
