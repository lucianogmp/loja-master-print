import { createClient } from '@supabase/supabase-js'

// Cliente do banco do ERP. Visitantes usam só a função pública loja_catalogo();
// o painel de administração usa o login de dono/admin do próprio ERP.
export const ERP_URL = (import.meta.env.VITE_ERP_URL as string) || 'https://qrgdcyceqsrtmerqazgp.supabase.co'

export const erp = createClient(
  ERP_URL,
  (import.meta.env.VITE_ERP_ANON_KEY as string) || 'sb_publishable_ibl32QMcmkNbPQJU5C6g4Q_u7CuXpeV',
  { auth: { storageKey: 'loja-erp-auth', persistSession: true, autoRefreshToken: true } },
)
