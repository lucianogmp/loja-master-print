import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from './Link'
import { useAuth } from '../lib/auth'
import { comVoltar } from '../lib/voltar'

/** Só mostra `children` com comprador logado; sem sessão, convida a entrar e volta para esta tela depois. */
export default function RequerSessao({ children }: { children: ReactNode }) {
  const { session, carregando, expirou } = useAuth()
  const { pathname, search } = useLocation()

  if (carregando) return <div className="container secao sessao-espera" aria-busy="true" />
  if (session) return <>{children}</>

  const voltar = pathname + search
  const entrar = comVoltar('/entrar', voltar)
  const titulo = expirou
    ? 'Sua sessão expirou. Entre novamente.'
    : /^\/pedidos(\/|$)/.test(pathname)
      ? 'Entre para ver seus pedidos'
      : 'Entre para acessar sua conta'

  return (
    <div className="container secao centro">
      <h1 className="titulo-pagina">{titulo}</h1>
      <div className="auth-acoes">
        <Link to={entrar} className="btn btn-primario">Entrar</Link>
        {!expirou && <Link to={comVoltar('/cadastro', voltar)} className="btn btn-secundario">Criar conta</Link>}
      </div>
    </div>
  )
}
