-- Tabela da conta do ResidênCão. Rode uma vez no SQL Editor do Supabase.
--
-- Cada linha é um pedaço do estado de uma pessoa: uma tentativa de simulado
-- (chave "tentativa:<id>") ou as marcas do cronograma do IPSEMG (chave
-- "revisao"). "progresso" diz o quanto aquele pedaço já andou, para o site
-- saber qual lado está mais adiantado.

create table if not exists public.dados (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  chave text not null,
  valor jsonb not null,
  progresso bigint not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave)
);

-- Cada pessoa só enxerga e muda as próprias linhas.
alter table public.dados enable row level security;

drop policy if exists "ler os próprios dados" on public.dados;
create policy "ler os próprios dados" on public.dados
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "criar os próprios dados" on public.dados;
create policy "criar os próprios dados" on public.dados
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "mudar os próprios dados" on public.dados;
create policy "mudar os próprios dados" on public.dados
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Quem não entrou não tem acesso nenhum à tabela.
revoke all on public.dados from anon;
grant select, insert, update on public.dados to authenticated;
