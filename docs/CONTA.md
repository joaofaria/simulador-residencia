# Conta e sincronização entre navegadores

O site guarda tudo no navegador, como sempre. Quem entra na conta passa a
levar para ela o histórico de simulados, a prova em andamento (com as
alternativas riscadas) e as marcas do cronograma do IPSEMG. Os flashcards
ficam fora e continuam só no navegador.

## Como os dados se juntam

- Cada tentativa é guardada separada, pelo id. Entrar num navegador soma o
  que ele já tinha com o que já está na conta; nada é apagado.
- Se a mesma tentativa existe dos dois lados, vale a mais adiantada:
  terminada ganha de não terminada e, entre duas abertas, vale a com mais
  tempo de prova.
- A prova que está aberta na tela só sobe quando pausa, quando você sai dela
  ou quando termina, para não mandar a prova inteira a cada segundo.
- As marcas do cronograma se juntam tópico a tópico, e em cada tópico vale a
  mudança mais recente (marcar ou desmarcar).
- O site sincroniza ao abrir, ao voltar para a aba, depois de mudanças e no
  botão "Sincronizar agora" da página Conta (`#/conta`).

O código fica em `src/services/sync.ts` (conta e envio),
`src/services/useSync.ts` (quando sincronizar) e `src/services/revisao.ts`
(marcas do cronograma).

## Como ligar

A conta usa o Supabase (plano grátis). Sem configurar, o site sai sem a opção
de conta e funciona como antes.

1. Crie um projeto em https://supabase.com (Start your project, New project).
   Escolha a região São Paulo e anote a senha do banco em lugar seguro; o
   site não precisa dela.
2. No projeto, abra **SQL Editor**, cole o conteúdo de `supabase/dados.sql` e
   clique em **Run**.
3. Em **Authentication > Users**, clique em **Add user > Create new user**,
   preencha seu e-mail e uma senha e deixe marcado **Auto Confirm User**.
4. Em **Authentication > Sign In / Providers**, desligue **Allow new users to
   sign up**. Assim só a conta criada no passo 3 existe.
5. Em **Project Settings > API Keys**, copie a **Publishable key** (começa
   com `sb_publishable_`). Em **Project Settings > Data API** (ou na página
   inicial do projeto), copie a **Project URL** (`https://xxxx.supabase.co`).
6. No GitHub, em **Settings > Secrets and variables > Actions > Variables**,
   crie duas variáveis de repositório:
   - `SUPABASE_URL` com a Project URL;
   - `SUPABASE_KEY` com a Publishable key.
7. Em **Actions > Publicar no GitHub Pages**, clique em **Run workflow** (ou
   espere o próximo merge na main). Depois disso o rodapé do site mostra
   "Entrar".

A Publishable key é pública por natureza: ela vai no JavaScript do site e só
dá acesso ao que as regras da tabela permitem (cada pessoa só lê e muda as
próprias linhas). Nunca use a **Secret key** (ou a antiga `service_role`) no
site.

Para rodar localmente com a conta, crie `.env.local` com
`VITE_SUPABASE_URL=...` e `VITE_SUPABASE_KEY=...` (o arquivo não vai para o
Git).

Projetos grátis do Supabase pausam depois de uma semana sem uso. Se a
sincronização der erro depois de um tempo parado, entre no painel do
Supabase e clique em **Restore project**; os dados ficam guardados.
