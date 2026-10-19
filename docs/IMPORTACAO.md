# Importar e conferir provas reais

## 1. Registrar a origem

Preserve o PDF original e registre instituição, ano de ingresso, nome do arquivo, URL oficial quando conhecida, data de obtenção e hash SHA-256. O ano da prova deve ser confirmado na capa, sem inferência pelo nome. Guarde o gabarito definitivo e as decisões após recursos separadamente. O site é público e não publica PDFs: o caderno e o gabarito ficam só na sua máquina (pasta `imports/pdfs`, fora do Git), e o repositório guarda o texto, as figuras e tabelas de que a questão depende e o hash do arquivo conferido. Material de cursinhos e compilações de terceiros (apostilas, PDFs com marca, recortes da diagramação deles) não entra no repositório, nem como fonte visual. Quando o gabarito oficial não for localizado, registre a origem como `third-party` e diga isso na tela.

## 2. Extrair sem publicar automaticamente

Extraia o texto do caderno da banca com poppler (`pdftotext -bbox-layout`) ou PyMuPDF e gere rascunhos fora de `src/data`. A extração não é prova de integridade: colunas, imagens e fontes especiais podem embaralhar a ordem. O importador do IPSEMG, descrito abaixo, é o modelo.

## 3. Montar questões

Organize os arquivos por instituição e ano, em `src/data/<instituição>/<ano>.json`; o catálogo `src/data/catalog.ts` agrega esses arquivos. Use o contrato `questionSchema` em `src/types/index.ts`:

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
  "source": { "credit": "Caderno de Entrada Direta ... Instituto ACCESS", "pages": [2] },
  "review": "required",
  "notes": "Conferir texto, alternativas e imagens no original."
}
```

O exemplo acima é um contrato, não uma questão. Não introduza esses placeholders no catálogo público. Não corrija ortografia ou simplifique enunciados. Refaça tabelas no campo `tables` (cabeçalho e linhas em texto) e guarde figuras em `public/provas/figuras/<prova>/qNNN.jpg`, recortadas só na figura, com alt descritivo. Preserve fórmulas, unidades e referências. Use `area` apenas quando identificada; não force classificação.

## 4. Conferir integridade

Confronte cada questão e todas as alternativas visualmente com o PDF, incluindo continuação em outra página. Compare quantidade e sequência com a prova; não suponha 75 questões. Registre responsável, data e decisões numa ficha de revisão por prova. Itens ilegíveis/incompletos ficam `review: required`, com motivo em `notes`; não libere a prova enquanto existir qualquer item não aprovado.

## 5. Verificar gabarito

Após a confirmação da fonte adotada (documento oficial da banca sempre que existir):

- Verificada: `{"status":"verified","answer":"A","source":"URL ou caminho do gabarito definitivo, data e referência"}`.
- Anulada: `{"status":"annulled","source":"Referência à decisão oficial definitiva"}`.
- Sem verificação: `{"status":"pending"}`.

Arquive versões anteriores e registre alterações após recursos. Não deduza respostas por conhecimento médico. É possível praticar com todos os enunciados conferidos e gabaritos pendentes, mas o resultado será parcial. Anulação oficial e falta de gabarito são estados distintos.

## 6. Liberar

Execute `npm run validate:data`, `npm test` e `npm run build`. A validação estrutural procura IDs/números duplicados, alternativas repetidas, origem inconsistente e respostas inexistentes. Ela não verifica a fidelidade textual. Confira imagens, leitura mobile e acessibilidade; a liberação requer revisão humana integral. Mantenha questões pendentes de transcrição fora do catálogo aprovado. Tentativas existentes preservam o banco e gabarito utilizados na realização.

## Provas do IPSEMG

O caderno do Instituto ACCESS tem duas colunas e o gabarito vem em PDF separado. Coloque `ipsemg-<ano>.pdf` e `ipsemg-<ano>-gabarito.pdf` em `imports/pdfs` (ou indique outra pasta em `PROVAS_PDF_DIR`). No Linux, com poppler e Pillow:

```sh
python3 scripts/import-ipsemg.py 2024 2025 2026
```

O script lê cada questão pela coluna, junta o texto comum a duas questões ("Considere o trecho a seguir para as questões 18 e 19") às duas, lê o gabarito definitivo (`**` ou `X` é anulada), confere que há 100 questões e 100 respostas e grava `src/data/ipsemg/<ano>.json` só com o texto e o crédito à banca, sem recortes de página, e a entrada em `imports/sources.json`. Figuras e tabelas são acrescentadas à mão (veja abaixo). Em 2026 o gabarito tem quatro tipos de prova; o script usa a Prova 1, que corresponde ao caderno tipo 1, e para se ela diferir entre os programas de Entrada Direta.

## PSU-MG e Santa Casa BH

Estas seis provas foram importadas em 13/10/2026 a partir de PDFs compilados por um cursinho. Em 16/10/2026 esse material saiu do site e do repositório: ficaram a transcrição das questões, com crédito à banca no campo `source.credit`, as figuras clínicas recortadas da própria imagem embutida (sem a moldura do compilado) e os gabaritos oficiais localizados, citados no texto da fonte sem publicar o arquivo. Não há caderno publicado, e o IPSEMG segue a mesma regra: só texto, sem modo Original.

O texto foi reorganizado em parágrafos, com afirmativas (I, II, III), parênteses de verdadeiro ou falso e colunas para relacionar em linhas próprias, sem mudar palavras. As respostas foram conferidas contra os gabaritos oficiais: PSU-MG 2024 é a Prova Geral Tipo 3 e PSU-MG 2025 e 2026 são o Tipo 1, porque as anulações e respostas batem com esses tipos; na Santa Casa BH, 2025 e 2026 batem com o tipo A. `imports/sources.json` traz os endereços das cópias usadas (publicadas pelo Estratégia MED) e os hashes dos arquivos conferidos, que não ficam no repositório.

### PSU-MG 2021, 2022 e 2023

Entraram em 19/10/2026. Nem a AREMG nem o IBGP publicam os cadernos antigos; o texto veio de cópias redigitadas a partir de fotos da prova, publicadas pela OsceLabs, e as respostas vêm dos gabaritos oficiais baixados do site da AREMG. Comparando as respostas da cópia com os quatro tipos de prova, 2021 é a Prova Geral Tipo 1 e 2022 e 2023 são o Tipo 3. Os erros de digitalização (letras trocadas, números partidos, sílabas perdidas) foram corrigidos à mão; nas questões 58 e 75 de 2023 faltava uma palavra na cópia ("pé" e "bacia"), completada pelo João. A tabela de graus de choque da questão 18 de 2023 era uma foto com anotações à mão e foi refeita em texto. Não há edição de 2023 da Santa Casa BH disponível, e o IPSEMG só passou a ter prova própria em 2024; antes disso os candidatos faziam o PSU-MG.

`src/data/figuras.json` repete as figuras e tabelas dessas provas por questão. O histórico do navegador guarda uma cópia de cada prova feita; ao carregar tentativas antigas, `src/services/storage.ts` tira delas os recortes e PDFs que saíram do site e põe essas figuras no lugar. `npm run validate:data` falha se o arquivo divergir das provas.
