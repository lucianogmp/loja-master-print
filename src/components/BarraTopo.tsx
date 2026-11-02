import { type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, Menu, Search, User } from 'lucide-react'
import { Link, useNavegar } from './Link'
import { useShell } from './LojaShell'
import Marca from './Marca'
import Avatar from './Avatar'
import { useAuth } from '../lib/auth'
import { destinoAoVoltar, useTemHistoricoInterno } from '../lib/telas'
import { comVoltar } from '../lib/voltar'
import { useMenuLateral } from '../hooks/useMenuLateral'

/** Barra do alto no celular, em uma linha: raiz (menu · logo · busca · conta) ou subpágina (voltar · título). */
export default function BarraTopo({ botaoMenu }: { botaoMenu?: RefObject<HTMLButtonElement | null> }) {
  const { handle, titulo } = useShell()
  const { abrir } = useMenuLateral()
  const navegar = useNavegar()
  const temHistorico = useTemHistoricoInterno()

  if (handle?.nivel === 'sub') {
    const texto = titulo ?? handle.titulo ?? ''
    return (
      <header className="barra-topo-app barra-topo-sub">
        <button
          type="button"
          className="icone-botao"
          aria-label="Voltar"
          onClick={() => navegar(destinoAoVoltar(handle, temHistorico))}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="barra-titulo" title={texto}>
          {texto}
        </h1>
        <span className="barra-topo-vazio" aria-hidden="true" />
      </header>
    )
  }

  const naBusca = handle?.aba === 'buscar'
  return (
    <header className="barra-topo-app">
      <button ref={botaoMenu} type="button" className="icone-botao" aria-label="Abrir menu" onClick={abrir}>
        <Menu size={22} />
      </button>
      <div className="barra-topo-marca">
        <Marca />
      </div>
      <div className="barra-topo-acoes">
        {!naBusca && (
          <Link to="/buscar" className="icone-botao" aria-label="Buscar">
            <Search size={22} />
          </Link>
        )}
        <AcessoConta />
      </div>
    </header>
  )
}

/** Avatar quando há login, ícone de entrar sem login e um espaço neutro enquanto a sessão carrega. */
function AcessoConta() {
  const { session, carregando } = useAuth()
  const { pathname } = useLocation()

  if (carregando) return <span className="icone-botao" aria-hidden="true"><span className="avatar avatar-p avatar-espera" /></span>
  if (session) {
    const nome = (session.user.user_metadata as { nome?: string } | undefined)?.nome
    return (
      <Link to="/conta" className="icone-botao" aria-label="Minha conta">
        <Avatar nome={nome} email={session.user.email ?? ''} tamanho="p" />
      </Link>
    )
  }
  return (
    <Link to={comVoltar('/entrar', pathname)} className="icone-botao" aria-label="Entrar">
      <User size={22} />
    </Link>
  )
}
