# Verificação da entrega

Em 16/10/2026, com a retirada do material de cursinho de PSU-MG e Santa Casa BH: `npm run validate:data` com nove provas e 750 questões, `npm test` e build aprovados. As 450 questões dessas provas conferem com a transcrição anterior; mudou a quebra de linhas e, em oito questões com colunas ou afirmativas, a pontuação que separava os itens. Gabaritos conferidos contra os documentos oficiais de PSU-MG 2024 e 2025 e Santa Casa BH 2025 e 2026, sem divergência.

Em 15/10/2026, com a entrada das provas do IPSEMG: `npm run validate:data` com nove provas e 750 questões (150 por área), `npm test` com 78 testes aprovados e build aprovado. A tela inicial e a primeira questão do IPSEMG 2026 foram abertas no Chromium em largura de celular.

Executado em 13/10/2026:

- `npm test`: 36 testes aprovados.
- `npm run build`: TypeScript e build Vite aprovados; artefatos em `dist`.
- `npm run validate:data`: seis provas liberadas, 450 questões e 18 anuladas.
- Extração PDFKit: seis documentos processados; 450 questões liberadas com gabaritos dos PDFs aceitos pelo usuário; recortes originais preservam imagens, tabelas e continuações.
- Código da aplicação sem uso de `any`.

Os testes cobrem acúmulo de tempo, pausa, retomada, retorno a questões, finalização imutável, respostas em branco, anuladas, pendentes, correção, percentual, tempo médio, snapshots das provas, múltiplas tentativas, migração de armazenamento, recuperação de sessão, gravação no localStorage, falha de gravação e bloqueio de provas sem transcrição aprovada. O resultado calculado é persistido ao finalizar.

A execução visual em navegador não foi realizada localmente: este ambiente bloqueou a abertura de porta local.

Deploy no GitHub Pages: o workflow `Publicar no GitHub Pages` roda a cada push em `main`. A primeira execução bem-sucedida foi em 13/10/2026, no commit `8c45d04` (instalação no runner Linux, validação de dados, testes, build e publicação aprovados), depois de duas execuções anteriores que falharam na instalação das dependências nativas. O site está publicado em https://joaofaria.github.io/simulador-residencia/.

As seis provas de PSU-MG e Santa Casa BH estão liberadas. Gabaritos e anulações foram extraídos pela posição das células e comparados com o texto legível. A correção usa 432 questões válidas, com 18 anuladas excluídas do denominador. Desde 16/10/2026 essas provas aparecem só em texto, com figuras recortadas e crédito à banca. A demonstração usa apenas itens de interface fictícios e identificados, sem conteúdo médico.
