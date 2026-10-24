import { createClient } from '@supabase/supabase-js'

// Projeto Supabase SÓ de compradores (separado do ERP). A chave "publishable" é pública por desenho;
// a proteção está nas regras de linha (RLS) do banco.
// Se as variáveis não estiverem no Vercel, usa estes valores públicos (nunca derruba o site).
// Fixo de propósito: uma variável errada no Vercel não pode mandar compradores para outro banco (ex.: o do ERP).
const URL = 'https://tupbkbivxlaaglspgybi.supabase.co'
const CHAVE = 'sb_publishable_vxIeeKQLNHe42A8P04Q3pA_ocVXzwlg'

export const supabase = createClient(URL, CHAVE)
