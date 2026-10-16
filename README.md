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

As seis provas de PSU-MG e Santa Casa BH, ingresso 2024 a 2026, somam **450 questões**, com **18 anuladas**. Delas o site publica só o texto de cada questão, com o crédito à banca (AREMG no PSU-MG, IBGP na Santa Casa BH). Os cadernos não ficam no site. As figuras clínicas de que a questão depende (eletrocardiogramas, radiografias, tomografias, partogramas, fotos) foram recortadas sem moldura e ficam em `public/provas/figuras`; a tabela da Santa Casa BH 2024, questão 26, foi refeita em texto.

Os gabaritos de PSU-MG 2024 e 2025 e de Santa Casa BH 2025 e 2026 seguem os documentos oficiais da banca, guardados em `public/provas/<prova>-gabarito.pdf`. Em PSU-MG 2024 as questões seguem a numeração da Prova Geral Tipo 3; em 2025 e 2026, a do Tipo 1; na Santa Casa BH, a do tipo A. Para PSU-MG 2026 e Santa Casa BH 2024 o gabarito oficial completo não foi localizado: as respostas vêm de compilação de terceiros, e no PSU-MG 2026 as anulações foram conferidas no documento oficial de alterações após recursos. A tela inicial avisa qual é o caso de cada prova.

As provas de Entrada Direta do IPSEMG (Instituto ACCESS), ingresso 2024 a 2026, somam mais **300 questões**, 100 por ano, com **18 anuladas** segundo os gabaritos definitivos da banca. Os cadernos e gabaritos oficiais ficam em `public/provas` (`ipsemg-<ano>.pdf` e `ipsemg-<ano>-gabarito.pdf`); em 2026 foi usado o caderno tipo 1 com a Prova 1 do gabarito. Nessas provas o modo **Original** mostra recortes do caderno da banca, e o modo **Texto** traz a transcrição.

Há também uma demonstração de três itens de interface explicitamente fictícios, separada das provas reais. O manifesto `imports/sources.json` registra a origem de cada prova e de cada gabarito, com os hashes dos arquivos e as anulações.

Leia [o processo de importação](docs/IMPORTACAO.md) antes de adicionar questões.

## Tempo e interrupções

A contagem usa diferenças entre timestamps, sem depender da precisão do intervalo que atualiza a tela. Tempo total e individual são persistidos a cada segundo e em cada ação. Navegar liquida o tempo da questão anterior; retornar acumula a partir do último valor. Ocultar a página, fechar, sair da rota ou pressionar pausa interrompe a sessão. **Uma aba em segundo plano fica pausada**, e o usuário retoma explicitamente. Atualizar a página recupera a sessão pausada. O tempo offline não entra no total. Encerramentos abruptos do processo podem perder até o intervalo desde o último salvamento; não se contabiliza arbitrariamente esse período. Use uma única aba para responder: edição simultânea em várias abas não é suportada nesta versão.

## Correção e armazenamento

Percentual = acertos ÷ questões verificadas não anuladas; brancos válidos permanecem no denominador. Pendentes ficam fora da pontuação e produzem resultado parcial. Sem questões verificadas, o percentual é indisponível. Tempo médio = tempo total ÷ todas as questões, incluindo anuladas e pendentes.

`localStorage` usa um envelope versionado e validação Zod. A migração v1 → v2 está em `src/services/storage.ts`; formatos futuros ou inválidos não são sobrescritos. O histórico pode ser exportado em JSON. Cada tentativa finalizada armazena o resultado calculado, os percentuais e uma cópia da prova e do gabarito; uma atualização do banco não altera resultados antigos. Limpar dados do navegador apaga o histórico. Não há backend ou sincronização entre dispositivos.

## Estrutura

- `src/types`: contratos e validação em tempo de execução.
- `src/services`: máquina de sessão, correção, persistência e testes.
- `src/components`: renderização reutilizável das questões.
- `src/pages`: início, simulado, resultado e histórico.
- `src/App.tsx`: integração, rotas e ciclo de vida das sessões.
- `src/data`: catálogo real e demonstração separada.
- `public/provas`: cadernos e gabaritos oficiais do IPSEMG, gabaritos oficiais das outras provas e figuras das questões.
- `scripts`: extração e validação de importações.

## GitHub Pages

O app está publicado em https://joaofaria.github.io/simulador-residencia/

Cada push na branch `main` dispara o workflow `.github/workflows/deploy.yml` (também pode ser disparado manualmente). Ele executa validação de dados, testes e build e, se tudo passar, publica `dist` no Pages. A origem do Pages no repositório está em **Settings → Pages → Source → GitHub Actions**. O Vite usa `base: '/simulador-residencia/'`; `HashRouter` permite abrir resultados diretamente sem regras de reescrita.

As visitas são contadas pelo [GoatCounter](https://www.goatcounter.com), sem cookies. O código da conta fica em `GOATCOUNTER_CODE`, em `src/services/visits.ts`; vazio, nada é contado. Cada troca de tela conta como uma página (`/`, `/simulado`, `/resultado`, `/historico`), e só o site publicado conta, nunca o `npm run dev`. Os números ficam no painel da conta, em `https://<código>.goatcounter.com`.

Os arquivos em `public/provas` são servidos como assets públicos junto com o site.
