# Simulador de Residência Médica

Aplicação independente em React + TypeScript + Vite. Interface em português, temas claro/escuro, navegação por questões, cronômetros, histórico local e revisão com filtros e gráficos.

## Executar

Node.js 22.12 ou superior.

```sh
npm install
npm run dev
npm test
npm run validate:data
npm run build
npm run preview
```

Acesse a URL informada pelo Vite, com `/simulador-residencia/`.

As versões diretas estão fixadas em `package.json`. O workflow instala as dependências com `npm ci --include=optional --legacy-peer-deps` a partir do `package-lock.json` e confere se os bindings nativos de Linux (`rolldown` e `@tailwindcss/oxide`) carregam antes de seguir.

## Estado das provas

As seis provas de PSU-MG e Santa Casa BH, ingresso 2024 a 2026, somam **450 questões**, com **18 anuladas**. Delas o site publica só o texto de cada questão, com o crédito à banca (AREMG no PSU-MG, IBGP na Santa Casa BH). O site não publica nenhum PDF para download. As figuras clínicas de que a questão depende (eletrocardiogramas, radiografias, tomografias, partogramas, fotos) foram recortadas sem moldura e ficam em `public/provas/figuras`; a tabela da Santa Casa BH 2024, questão 26, foi refeita em texto.

Os gabaritos de PSU-MG 2024 e 2025 e de Santa Casa BH 2025 e 2026 seguem os documentos oficiais da banca, citados em cada questão (os arquivos foram conferidos, mas não são publicados). Em PSU-MG 2024 as questões seguem a numeração da Prova Geral Tipo 3; em 2025 e 2026, a do Tipo 1; na Santa Casa BH, a do tipo A. Para PSU-MG 2026 e Santa Casa BH 2024 o gabarito oficial completo não foi localizado: as respostas vêm de compilação de terceiros, e no PSU-MG 2026 as anulações foram conferidas no documento oficial de alterações após recursos. A tela inicial avisa qual é o caso de cada prova.

As provas de Entrada Direta do IPSEMG (Instituto ACCESS), ingresso 2024 a 2026, somam mais **300 questões**, 100 por ano, com **18 anuladas** segundo os gabaritos definitivos da banca. Os gabaritos definitivos da banca foram usados na correção; em 2026 foi usado o caderno tipo 1 com a Prova 1 do gabarito. Como nas outras, o site publica só o texto de cada questão, com o crédito à banca, e a figura ou a tabela de que a questão depende (uma imagem na questão 4 de 2024 e uma tabela na 69). Nenhum PDF é publicado.

Há também uma demonstração de três itens de interface explicitamente fictícios, separada das provas reais. O manifesto `imports/sources.json` registra a origem de cada prova e de cada gabarito, com os hashes dos arquivos conferidos e as anulações.

Leia [o processo de importação](docs/IMPORTACAO.md) antes de adicionar questões.

## Tempo e interrupções

A contagem usa diferenças entre timestamps, sem depender da precisão do intervalo que atualiza a tela. Tempo total e individual são persistidos a cada segundo e em cada ação. Navegar liquida o tempo da questão anterior; retornar acumula a partir do último valor. Ocultar a página, fechar, sair da rota ou pressionar pausa interrompe a sessão. **Uma aba em segundo plano fica pausada**, e o usuário retoma explicitamente. Atualizar a página recupera a sessão pausada. O tempo offline não entra no total. Encerramentos abruptos do processo podem perder até o intervalo desde o último salvamento; não se contabiliza arbitrariamente esse período. Use uma única aba para responder: edição simultânea em várias abas não é suportada nesta versão.

## Correção e armazenamento

Percentual = acertos ÷ questões verificadas não anuladas; brancos válidos permanecem no denominador. Pendentes ficam fora da pontuação e produzem resultado parcial. Sem questões verificadas, o percentual é indisponível. Tempo médio = tempo total ÷ todas as questões, incluindo anuladas e pendentes.

`localStorage` usa um envelope versionado e validação Zod. A migração v1 → v2 está em `src/services/storage.ts`; formatos futuros ou inválidos não são sobrescritos. O histórico pode ser exportado em JSON. Cada tentativa finalizada armazena o resultado calculado, os percentuais e uma cópia da prova e do gabarito; uma atualização do banco não altera resultados antigos. Limpar dados do navegador apaga o histórico. Não há backend ou sincronização entre dispositivos.

## Flashcards

A página `#/flashcards` importa baralhos do Anki (`.apkg`, formato antigo e novo) e estuda com revisão espaçada no estilo do Anki: passos de aprendizado, facilidade, lapsos e limites diários por baralho. O arquivo é lido num worker do próprio navegador (`src/flashcards/worker.ts`, com sql.js) e gravado no IndexedDB; nada é enviado a servidor e nenhum baralho faz parte do repositório. O progresso fica no navegador, fora do histórico em `localStorage`. Na importação, cartões com imagem que não vem dentro do arquivo (link externo ou figura que falta) ficam de fora por padrão, porque o link pode sair do ar. O baralho "Provas oficiais" é gerado no próprio navegador com as questões do banco que têm gabarito (`src/flashcards/official.ts`), separadas por área e prova (a frente é só o enunciado, sem as alternativas, e o verso traz a resposta certa); o botão de atualizar acrescenta questões novas sem apagar o progresso. Os `.apkg` de `src/flashcards/fixtures` são baralhos de teste gerados por `scripts/flashcards-fixtures.py` (precisa do pacote Python `anki`).

## Estrutura

- `src/types`: contratos e validação em tempo de execução.
- `src/services`: máquina de sessão, correção, persistência e testes.
- `src/components`: renderização reutilizável das questões.
- `src/pages`: início, simulado, resultado, histórico e flashcards.
- `src/flashcards`: leitura de .apkg, agendamento, modelos de cartão e armazenamento dos baralhos.
- `src/App.tsx`: integração, rotas e ciclo de vida das sessões.
- `src/data`: catálogo real e demonstração separada.
- `public/provas`: figuras das questões. Nenhum PDF fica aqui (`npm run validate:data` falha se aparecer um).
- `scripts`: extração e validação de importações.

## GitHub Pages

O app está publicado em https://joaofaria.github.io/simulador-residencia/

Cada push na branch `main` dispara o workflow `.github/workflows/deploy.yml` (também pode ser disparado manualmente). Ele executa validação de dados, testes e build e, se tudo passar, publica `dist` no Pages. A origem do Pages no repositório está em **Settings → Pages → Source → GitHub Actions**. O Vite usa `base: '/simulador-residencia/'`; `HashRouter` permite abrir resultados diretamente sem regras de reescrita.

As visitas são contadas pelo [GoatCounter](https://www.goatcounter.com), sem cookies. O código da conta fica em `GOATCOUNTER_CODE`, em `src/services/visits.ts`; vazio, nada é contado. Cada troca de tela conta como uma página (`/`, `/simulado`, `/resultado`, `/historico`), e só o site publicado conta, nunca o `npm run dev`. Os números ficam no painel da conta, em `https://<código>.goatcounter.com`.

Tudo em `public` é servido junto com o site, por isso PDFs de prova ficam de fora.
