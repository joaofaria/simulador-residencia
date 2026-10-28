import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  base: "/simulador-residencia/",
  plugins: [react(), tailwindcss()],
  // O leitor de .apkg roda num worker que carrega o sql.js sob demanda.
  worker: { format: "es" },
});
