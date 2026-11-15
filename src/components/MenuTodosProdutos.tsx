import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { Link } from './Link'
import { useCatalogo } from '../lib/catalogo'
import { useAjustes } from '../lib/ajustes'

const PADRAO_QTD = 6

/**
 * Faixa de categorias do cabeçalho (computador), no estilo de gráficas online: um botão "Todos os produtos" que abre
 * o painel com TODAS as categorias, e ao lado só as categorias que o dono escolheu destacar no /admin (Categorias).
 * Sem escolha feita, mostra as primeiras. Fica em uma linha só e não muda de tamanho ao rolar a página.
 */
export default function MenuTodosProdutos({ atual }: { atual?: string | null }) {
  const { categorias } = useCatalogo()
  const { ajustes } = useAjustes()
  const { pathname, search } = useLocation()
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  // Fecha ao trocar de página, ao clicar fora e com Esc
  useEffect(() => setAberto(false), [pathname, search])
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])

  const escolhidas = ajustes.menu.destaques
  const destaques = escolhidas.length
    ? categorias.filter((c) => escolhidas.includes(c.slug))
    : categorias.slice(0, PADRAO_QTD)

  return (
    <nav className="categorias menu-todos" aria-label="Categorias" ref={raiz}>
      <div className="container categorias-lista">
        {categorias.length > 0 && (
        <button type="button" className={`menu-todos-botao${aberto ? ' aberto' : ''}`} aria-expanded={aberto} aria-controls="menu-todos-painel" onClick={() => setAberto((a) => !a)}>
          <LayoutGrid size={16} aria-hidden="true" /> Todos os produtos <ChevronDown size={15} aria-hidden="true" />
        </button>
        )}
        {destaques.map((c) => (
          <Link key={c.slug} to={`/produtos?categoria=${c.slug}`} className={atual === c.slug ? 'ativo' : ''}>{c.nome}</Link>
        ))}
      </div>
      {aberto && categorias.length > 0 && (
        <div id="menu-todos-painel" className="menu-todos-painel">
          <div className="container">
            <ul className="menu-todos-grade">
              {categorias.map((c) => (
                <li key={c.slug}><Link to={`/produtos?categoria=${c.slug}`} className={atual === c.slug ? 'ativo' : ''}>{c.nome}</Link></li>
              ))}
            </ul>
            <Link to="/produtos" className="menu-todos-ver">Ver todos os produtos →</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
