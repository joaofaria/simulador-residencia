# Importar e conferir provas reais

## 1. Registrar a origem

Preserve o PDF original e registre instituição, ano de ingresso, nome do arquivo, URL oficial quando conhecida, data de obtenção e hash SHA-256. O ano da prova deve ser confirmado na capa, sem inferência pelo nome. Guarde o gabarito definitivo e as decisões após recursos separadamente. Neste projeto de uso pessoal, o usuário aceitou explicitamente os PDFs e seus gabaritos como fonte de verdade. Registre essa procedência; não descreva a aceitação pessoal como confirmação oficial. Para novas fontes, use a política de validação correspondente.

## 2. Extrair sem publicar automaticamente

Instale o extrator opcional: `npm install --no-save pdfjs-dist`. Execute:

```sh
npm run import:pdf -- /caminho/Provas_R1_2024_2026
```

Este comando copia os originais e gera textos por página em `imports`. Ele gera um catálogo inicial separado em `imports/catalog.generated.json`, preservando o banco aprovado em `src/data`. PDFs com colunas, imagens ou fontes especiais podem produzir ordem incorreta; a extração não é prova de integridade. No macOS existe também `swift scripts/extract-pdf.swift arquivo.pdf` para extrair páginas com PDFKit.

Os arquivos existentes em `imports/*.draft.json` são rascunhos extraídos dos seis PDFs fornecidos (75 itens por arquivo), usados como transcrição auxiliar do banco liberado após aceitação dos PDFs pelo usuário. `python3 scripts/prepare-drafts.py` recria esses rascunhos a partir dos textos por página, sem inferir gabaritos. O manifesto `imports/sources.json` registra hashes dos PDFs.

## 3. Montar questões

Organize os arquivos por instituição e ano, em `src/data/psu-mg` e `src/data/santa-casa-bh` (um JSON por ano); o catálogo `src/data/catalog.ts` agrega esses arquivos. Use o contrato `questionSchema` em `src/types/index.ts`:

```json
{
  "id": "psu-mg-2026-q001",
  "institution": "PSU-MG",
  "year": 2026,
  "number": 1,
  "statement": "TRANSCRIÇÃO LITERAL DO DOCUMENTO ORIGINAL",
  "alternatives": [
    { "letter": "A", "text": "TRANSCRIÇÃO LITERAL" },
    { "letter": "B", "text": "TRANSCRIÇÃO LITERAL" }
  ],
  "key": { "status": "pending" },
  "images": [],
  "source": { "pdf": "provas/psu-mg-2026.pdf", "pages": [2] },
  "review": "required",
  "notes": "Conferir texto, alternativas e imagens no original."
}
```

O exemplo acima é um contrato, não uma questão. Não introduza esses placeholders no catálogo público. Não corrija ortografia ou simplifique enunciados. Preserve tabelas como imagens com transcrição acessível, imagens em `public/provas/assets` com alt descritivo, fórmulas, unidades e referências. Use `area` apenas quando identificada; não force classificação.

## 4. Conferir integridade

Confronte cada questão e todas as alternativas visualmente com o PDF, incluindo continuação em outra página. Compare quantidade e sequência com a prova; não suponha 75 questões. Registre responsável, data e decisões numa ficha de revisão por prova. Itens ilegíveis/incompletos ficam `review: required`, com motivo em `notes`; não libere a prova enquanto existir qualquer item não aprovado.

## 5. Verificar gabarito

Após a confirmação da fonte adotada (oficial, quando disponível, ou PDF explicitamente aceito pelo usuário para uso pessoal):

- Verificada: `{"status":"verified","answer":"A","source":"URL ou caminho do gabarito definitivo, data e referência"}`.
- Anulada: `{"status":"annulled","source":"Referência à decisão oficial definitiva"}`.
- Sem verificação: `{"status":"pending"}`.

Arquive versões anteriores e registre alterações após recursos. Não deduza respostas por conhecimento médico. É possível praticar com todos os enunciados conferidos e gabaritos pendentes, mas o resultado será parcial. Anulação oficial e falta de gabarito são estados distintos.

## 6. Liberar

Execute `npm run validate:data`, `npm test` e `npm run build`. A validação estrutural procura IDs/números duplicados, alternativas repetidas, origem inconsistente e respostas inexistentes. Ela não verifica a fidelidade textual. Confira imagens, leitura mobile e acessibilidade; a liberação requer revisão humana integral. Mantenha questões pendentes de transcrição fora do catálogo aprovado. Tentativas existentes preservam o banco e gabarito utilizados na realização.

## Importação atual dos PDFs aceitos pelo usuário

As seis provas foram aceitas pelo usuário em 13/10/2026, incluindo seus gabaritos. Para reproduzir a importação no macOS, extraia o texto com PDFKit e prepare os rascunhos; depois gere os recortes e leia o gabarito por posição visual:

```sh
python3 scripts/prepare-drafts.py
swift scripts/render-questions.swift public/provas/psu-mg-2024.pdf public/provas/assets/psu-mg-2024 psu-mg-2024
# Repita o comando para cada um dos seis IDs do catálogo.
python3 scripts/publish-validated-pdfs.py
npm run validate:data
npm test
npm run build
```

`render-questions.swift` preserva imagens e tabelas em recortes PNG, incluindo continuações da questão. No gabarito, associa a resposta ao número pela posição na mesma linha/célula. Isso evita o erro da extração linear em células anuladas consecutivas (PSU-MG 2024: 18/19; Santa Casa BH 2026: 31/32). O arquivo `.rendered.json` registra as referências e respostas obtidas.

`publish-validated-pdfs.py` verifica o hash do PDF, correspondência entre números de questões/recortes/gabarito, existência das alternativas e dos arquivos de imagem. Compara as respostas que a extração de texto consegue identificar com a leitura visual por coordenadas; divergências interrompem a importação. Não presume 75 questões para novas provas. Recortes têm nomes por hash de conteúdo para manter os artefatos de tentativas anteriores. O catálogo recebe `basis: user-validated-pdf` nos gabaritos, mantendo a origem explícita.

A aprovação diz respeito ao documento original aceito pelo usuário. A transcrição auxiliar não substitui o original; o simulador inicia a leitura no modo Original. Não acrescente imagens, dados clínicos ou respostas que não constem nos documentos.
