import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
const root = process.argv[2];
if (!root)
  throw Error("Uso: npm run import:pdf -- /caminho/Provas_R1_2024_2026");
const exams = [];
for (const year of [2024, 2025, 2026])
  for (const [folder, institution, slug] of [
    ["PSU-MG", "PSU-MG", "psu-mg"],
    ["Santa_Casa_BH", "Santa Casa BH", "santa-casa-bh"],
  ]) {
    const dir = path.join(root, String(year), folder);
    const file = fs.readdirSync(dir).find((f) => f.endsWith(".pdf"));
    if (!file) throw Error(`PDF ausente: ${dir}`);
    const id = `${slug}-${year}`;
    const bytes = fs.readFileSync(path.join(dir, file));
    fs.writeFileSync(`public/provas/${id}.pdf`, bytes);
    const doc = await getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
    }).promise;
    let text = "";
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      let lastY = null;
      let lines = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 3) lines += "\n";
        lines += item.str + " ";
        lastY = y;
        if (item.hasEOL) lines += "\n";
      }
      pages.push({ number: n, text: lines });
      text += `\n[[PÁGINA ${n}]]\n${lines}`;
    }
    fs.mkdirSync("imports", { recursive: true });
    fs.writeFileSync(`imports/${id}.txt`, text);
    fs.writeFileSync(
      `imports/${id}.pages.json`,
      JSON.stringify(pages, null, 2),
    );
    exams.push({
      id,
      institution,
      year,
      title: `${institution} • ${year}`,
      demo: false,
      pdf: `provas/${id}.pdf`,
      questions: [],
    });
    console.log(id, doc.numPages, "páginas extraídas");
  }
fs.writeFileSync(
  "imports/catalog.generated.json",
  JSON.stringify(exams, null, 2),
);
