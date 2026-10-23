import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import { categorias } from '../data/produtos'
import { LOJA, linkWhatsApp } from '../config'
import { useCart } from '../lib/cart'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { totalItens } = useCart()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [busca, setBusca] = useState('')

  // O destaque da aba depende do ?categoria= da URL, não só do caminho
  const noCatalogo = pathname === '/produtos'
  const categoriaAtual = new URLSearchParams(search).get('categoria')

  function buscar(e: FormEvent) {
    e.preventDefault()
    const termo = busca.trim()
    navigate(termo ? `/produtos?busca=${encodeURIComponent(termo)}` : '/produtos')
  }

  return (
    <header className="header">
      <div className="barra-topo">
        <div className="container barra-topo-conteudo">
          <span>{LOJA.horario}</span>
          <a href={linkWhatsApp('Olá! Vim pelo site da Master Print.')} target="_blank" rel="noreferrer">
            Atendimento pelo WhatsApp
          </a>
        </div>
      </div>

      <div className="container header-principal">
        <Link to="/" className="marca" aria-label={`${LOJA.nome} — página inicial`}>
          <img className="marca-logo" src="/favicon.svg" alt="" width={40} height={40} />
          <span className="marca-texto">
            <strong>
              <span className="marca-azul">MASTER</span> PRINT
            </strong>
            <small>{LOJA.slogan}</small>
          </span>
        </Link>

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
          <Link to="/carrinho" className="carrinho-link" aria-label={`Carrinho, ${totalItens} itens`}>
            <ShoppingCart size={20} />
            <span className="carrinho-texto">Carrinho</span>
            {totalItens > 0 && <span className="contador">{totalItens}</span>}
          </Link>
        </div>
      </div>

      <nav className="categorias" aria-label="Categorias">
        <div className="container categorias-lista">
          <Link to="/produtos" className={noCatalogo && !categoriaAtual ? 'active' : ''}>
            Todos
          </Link>
          {categorias.map((c) => (
            <Link
              key={c.slug}
              to={`/produtos?categoria=${c.slug}`}
              className={noCatalogo && categoriaAtual === c.slug ? 'active' : ''}
            >
              {c.nome}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
