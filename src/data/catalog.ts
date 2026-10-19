import psu_mg_2021 from "./psu-mg/2021.json";
import psu_mg_2022 from "./psu-mg/2022.json";
import psu_mg_2023 from "./psu-mg/2023.json";
import psu_mg_2024 from "./psu-mg/2024.json";
import santa_casa_bh_2024 from "./santa-casa-bh/2024.json";
import psu_mg_2025 from "./psu-mg/2025.json";
import santa_casa_bh_2025 from "./santa-casa-bh/2025.json";
import psu_mg_2026 from "./psu-mg/2026.json";
import santa_casa_bh_2026 from "./santa-casa-bh/2026.json";
import ipsemg_2024 from "./ipsemg/2024.json";
import ipsemg_2025 from "./ipsemg/2025.json";
import ipsemg_2026 from "./ipsemg/2026.json";
import { examSchema } from "../types";
import { demo } from "./demo";
export const exams = [
  ...examSchema
    .array()
    .parse([
      psu_mg_2021,
      psu_mg_2022,
      psu_mg_2023,
      psu_mg_2024,
      santa_casa_bh_2024,
      ipsemg_2024,
      psu_mg_2025,
      santa_casa_bh_2025,
      ipsemg_2025,
      psu_mg_2026,
      santa_casa_bh_2026,
      ipsemg_2026,
    ]),
  demo,
];
