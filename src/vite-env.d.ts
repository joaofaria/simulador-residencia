/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Projeto do Supabase usado pela conta. Sem os dois, a conta não aparece.
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_KEY?: string;
}
