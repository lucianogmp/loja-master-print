import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { removerChaves } from './armazenamento'
import { limparCachePedidos } from './pedidos'

type Ctx = {
  session: Session | null
  carregando: boolean
  /** Chegou por link de redefinição de senha (evento PASSWORD_RECOVERY). */
  recuperacao: boolean
  /** A sessão venceu enquanto a pessoa usava o site. */
  expirou: boolean
  sair: () => Promise<void>
  marcarSessaoExpirada: () => Promise<void>
  concluirRecuperacao: () => void
}
const AuthContext = createContext<Ctx>({
  session: null,
  carregando: true,
  recuperacao: false,
  expirou: false,
  sair: async () => {},
  marcarSessaoExpirada: async () => {},
  concluirRecuperacao: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperacao, setRecuperacao] = useState(false)
  const [expirou, setExpirou] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSession(s)
      if (evento === 'PASSWORD_RECOVERY') setRecuperacao(true)
      else if (evento === 'SIGNED_OUT' || evento === 'USER_UPDATED') setRecuperacao(false)
      if (evento === 'SIGNED_IN') setExpirou(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const sair = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // sem rede o servidor não confirma, mas neste aparelho a pessoa sai de qualquer jeito
      setSession(null)
    } finally {
      removerChaves('loja-pedidos:')
      limparCachePedidos()
    }
  }, [])

  const marcarSessaoExpirada = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' })
    setExpirou(true)
  }, [])

  const concluirRecuperacao = useCallback(() => setRecuperacao(false), [])

  const valor = useMemo(
    () => ({ session, carregando, recuperacao, expirou, sair, marcarSessaoExpirada, concluirRecuperacao }),
    [session, carregando, recuperacao, expirou, sair, marcarSessaoExpirada, concluirRecuperacao],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/** Reenvia o e-mail de confirmação do cadastro; o link volta para `destino` (caminho interno). */
export function reenviarConfirmacao(email: string, destino: string) {
  return supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}${destino}` } })
}

/** O backend recusou por sessão vencida/inválida (HTTP 401 ou JWT expirado). */
export function erroDeSessao(erro: unknown): boolean {
  const e = erro as { status?: number; code?: string; message?: string } | null | undefined
  if (!e) return false
  return e.status === 401 || e.code === 'PGRST301' || /jwt (expired|invalid)/i.test(e.message ?? '')
}

export const MSG_SEM_CONEXAO = 'Sem conexão. Tente novamente.'

// Mensagens genéricas: não revelam se um e-mail já existe.
export function erroAmigavel(msg: string): string {
  console.error('[auth]', msg)
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  return `Não foi possível concluir. Tente novamente. (detalhe: ${msg})`
}
