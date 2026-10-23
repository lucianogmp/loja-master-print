import { createClient } from '@supabase/supabase-js'

// Projeto Supabase SÓ de compradores (separado do ERP). A chave "publishable" é pública por desenho;
// a proteção está nas regras de linha (RLS) do banco.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)
