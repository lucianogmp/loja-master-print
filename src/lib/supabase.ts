import { createClient } from '@supabase/supabase-js'

// Projeto Supabase SÓ de compradores (separado do ERP). A chave "publishable" é pública por desenho;
// a proteção está nas regras de linha (RLS) do banco.
// Se as variáveis não estiverem no Vercel, usa estes valores públicos (nunca derruba o site).
const URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://tupbkbivxlaaglspgybi.supabase.co'
const CHAVE =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_vxIeeKQLNHe42A8P04Q3pA_ocVXzwlg'

export const supabase = createClient(URL, CHAVE)
