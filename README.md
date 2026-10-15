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

As seis provas reais de PSU-MG e Santa Casa BH, 2024–2026, estão liberadas: **450 questões**, com **18 anuladas** identificadas nos gabaritos dos documentos. Os PDFs e seus gabaritos foram aceitos pelo usuário como fonte de verdade para uso pessoal. A correção usa exclusivamente esses gabaritos, sem deduzir respostas por conhecimento médico ou substituir a origem por uma suposta confirmação oficial.

O modo **Original** mostra recortes fiéis das questões, com imagens, tabelas e continuações entre páginas. O botão **Ampliar** facilita a leitura de detalhes. O modo **Texto** oferece uma transcrição auxiliar para leitura fluida; o documento original prevalece em caso de diferença. Os recortes usam nomes por hash de conteúdo, preservando as referências de tentativas anteriores quando novas versões forem importadas.

Há também uma demonstração de três itens de interface explicitamente fictícios, separada das provas reais. O manifesto `imports/sources.json` registra os hashes dos PDFs, a validação do usuário e as anulações. Os rascunhos de extração permanecem em `imports` como material de auditoria.

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
- `public/provas`: documentos originais.
- `scripts`: extração e validação de importações.

## GitHub Pages

O app está publicado em https://joaofaria.github.io/simulador-residencia/

Cada push na branch `main` dispara o workflow `.github/workflows/deploy.yml` (também pode ser disparado manualmente). Ele executa validação de dados, testes e build e, se tudo passar, publica `dist` no Pages. A origem do Pages no repositório está em **Settings → Pages → Source → GitHub Actions**. O Vite usa `base: '/simulador-residencia/'`; `HashRouter` permite abrir resultados diretamente sem regras de reescrita.

Os PDFs em `public/provas` são servidos como assets públicos junto com o site.
