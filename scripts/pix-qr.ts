// Gera o QR code do Pix como SVG estático, sem depender de serviço externo.
// Rode de novo (npm run pix:qr) sempre que mudar a chave, o nome ou a cidade.
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";
import { pixPayload } from "../src/services/pix";

export function pixSvg() {
  return QRCode.toString(pixPayload(), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

if (process.argv[1]?.endsWith("pix-qr.ts")) {
  const svg = await pixSvg();
  writeFileSync(new URL("../src/assets/pix-qr.svg", import.meta.url), svg);
  console.log("src/assets/pix-qr.svg atualizado");
}
