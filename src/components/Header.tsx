import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Settings, ShoppingCart, User } from 'lucide-react'
import { Link, useNavegar } from './Link'
import { linkWhatsApp } from '../config'
import { comVoltar } from '../lib/voltar'
import { useSite } from '../lib/site'
import { useCart } from '../lib/cart'
import { useAuth } from '../lib/auth'
import { useEhAdmin } from '../lib/erpAdmin'
import ThemeToggle from './ThemeToggle'
import Marca from './Marca'
import Avatar from './Avatar'
import ChipsCategorias from './ChipsCategorias'

export default function Header() {
  const { empresa } = useSite()
  const { totalItens } = useCart()
  const ehAdmin = useEhAdmin()
  const navegar = useNavegar()
  const { pathname, search } = useLocation()
  const [busca, setBusca] = useState('')

  // O destaque da aba depende do ?categoria= da URL, não só do caminho
  const noCatalogo = pathname === '/produtos'
  const categoriaAtual = new URLSearchParams(search).get('categoria')

  function buscar(e: FormEvent) {
    e.preventDefault()
    const termo = busca.trim()
    navegar(termo ? `/produtos?busca=${encodeURIComponent(termo)}` : '/produtos')
  }

  return (
    <header className="header">
      <div className="barra-topo">
        <div className="container barra-topo-conteudo">
          <span>{empresa.horario}</span>
          {empresa.whatsapp && (
            <a href={linkWhatsApp()} target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="container header-principal">
        <Marca />

        <form className="busca" onSubmit={buscar} role="search">
          <Search size={18} className="busca-icone" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produtos (ex.: banner, cartão)"
            aria-label="Buscar produtos"
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="header-acoes">
          <ThemeToggle />
          {ehAdmin && (
            <Link to="/admin" className="carrinho-link">
              <Settings size={20} />
              <span className="carrinho-texto">Administração</span>
            </Link>
          )}
          <ContaAcesso />
          <Link to="/carrinho" className="carrinho-link" aria-label={`Carrinho, ${totalItens} itens`}>
            <ShoppingCart size={20} />
            <span className="carrinho-texto">Carrinho</span>
            {totalItens > 0 && <span className="contador">{totalItens}</span>}
          </Link>
        </div>
      </div>

      <ChipsCategorias faixa atual={noCatalogo ? categoriaAtual ?? undefined : null} />
    </header>
  )
}

/** Entrada da conta: avatar quando há login, "Entrar" sem login e um espaço neutro enquanto a sessão carrega. */
function ContaAcesso() {
  const { session, carregando } = useAuth()
  const { pathname } = useLocation()

  if (carregando)
    return (
      <span className="carrinho-link" aria-hidden="true">
        <span className="avatar avatar-p avatar-espera" />
      </span>
    )
  if (session) {
    const nome = (session.user.user_metadata as { nome?: string } | undefined)?.nome
    return (
      <Link to="/conta" className="carrinho-link" aria-label="Minha conta">
        <Avatar nome={nome} email={session.user.email ?? ''} tamanho="p" />
        <span className="carrinho-texto">Minha conta</span>
      </Link>
    )
  }
  return (
    <Link to={comVoltar('/entrar', pathname)} className="carrinho-link">
      <User size={20} />
      <span className="carrinho-texto">Entrar</span>
    </Link>
  )
}
