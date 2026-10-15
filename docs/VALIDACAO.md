# Verificação da entrega

Executado em 13/10/2026:

- `npm test`: 36 testes aprovados.
- `npm run build`: TypeScript e build Vite aprovados; artefatos em `dist`.
- `npm run validate:data`: seis provas liberadas, 450 questões e 18 anuladas.
- Extração PDFKit: seis documentos processados; 450 questões liberadas com gabaritos dos PDFs aceitos pelo usuário; recortes originais preservam imagens, tabelas e continuações.
- Código da aplicação sem uso de `any`.

Os testes cobrem acúmulo de tempo, pausa, retomada, retorno a questões, finalização imutável, respostas em branco, anuladas, pendentes, correção, percentual, tempo médio, snapshots das provas, múltiplas tentativas, migração de armazenamento, recuperação de sessão, gravação no localStorage, falha de gravação e bloqueio de provas sem transcrição aprovada. O resultado calculado é persistido ao finalizar.

A execução visual em navegador não foi realizada localmente: este ambiente bloqueou a abertura de porta local.

Deploy no GitHub Pages: o workflow `Publicar no GitHub Pages` roda a cada push em `main`. A primeira execução bem-sucedida foi em 13/10/2026, no commit `8c45d04` (instalação no runner Linux, validação de dados, testes, build e publicação aprovados), depois de duas execuções anteriores que falharam na instalação das dependências nativas. O site está publicado em https://joaofaria.github.io/simulador-residencia/.

O usuário validou os PDFs e autorizou seus gabaritos como fonte de verdade para uso pessoal. As seis provas estão liberadas. Gabaritos e anulações foram extraídos pela posição das células e comparados com o texto legível. A correção usa 432 questões válidas, com 18 anuladas excluídas do denominador. Os documentos fornecidos são a referência de conteúdo, com modo Original e transcrição auxiliar no modo Texto. A demonstração usa apenas itens de interface fictícios e identificados, sem conteúdo médico.
