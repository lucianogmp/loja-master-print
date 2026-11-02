import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Home, Package, Search, ShoppingCart, User } from 'lucide-react'
import { Link, useNavegar } from './Link'
import { useShell } from './LojaShell'
import Avatar from './Avatar'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ABAS, type Aba } from '../lib/telas'

/** Abas do celular, na ordem fixa Início · Buscar · Carrinho · Pedidos · Conta. */
export default function BarraInferior() {
  const { ehMobile, handle } = useShell()
  const { totalItens } = useCart()
  const { session } = useAuth()
  const { key } = useLocation()
  const navegar = useNavegar()
  const reduzido = useMediaQuery('(prefers-reduced-motion: reduce)')
  // Evita abrir a mesma aba duas vezes com toques seguidos antes da tela trocar
  const enviado = useRef<string | null>(null)
  useEffect(() => {
    enviado.current = null
  }, [key])

  if (!ehMobile || handle?.semBarra) return null

  function tocar(e: MouseEvent, aba: Aba, para: string) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (handle?.aba === aba) {
      e.preventDefault()
      if (handle.nivel === 'raiz') window.scrollTo({ top: 0, behavior: reduzido ? 'auto' : 'smooth' })
      else navegar(para, { viewTransition: false })
      return
    }
    if (enviado.current === para) return e.preventDefault()
    enviado.current = para
  }

  const nome = (session?.user.user_metadata as { nome?: string } | undefined)?.nome
  const icones: Record<Aba, ReactNode> = {
    inicio: <Home size={22} />,
    buscar: <Search size={22} />,
    carrinho: <ShoppingCart size={22} />,
    pedidos: <Package size={22} />,
    conta: session ? <Avatar nome={nome} email={session.user.email ?? ''} tamanho="p" /> : <User size={22} />,
  }

  return (
    <nav className="barra-inferior" aria-label="Navegação principal">
      {ABAS.map(({ aba, rotulo, para }) => (
        <Link
          key={aba}
          to={para}
          viewTransition={false}
          className={handle?.aba === aba ? 'aba ativa' : 'aba'}
          aria-current={handle?.aba === aba ? 'page' : undefined}
          aria-label={aba === 'carrinho' && totalItens > 0 ? `Carrinho, ${totalItens} ${totalItens === 1 ? 'item' : 'itens'}` : undefined}
          onClick={(e) => tocar(e, aba, para)}
        >
          <span className="aba-icone">
            {icones[aba]}
            {aba === 'carrinho' && totalItens > 0 && <span className="contador">{totalItens > 9 ? '9+' : totalItens}</span>}
          </span>
          <span className="aba-rotulo">{rotulo}</span>
        </Link>
      ))}
    </nav>
  )
}
