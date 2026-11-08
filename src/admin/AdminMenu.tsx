import { useEffect, type RefObject } from 'react'
import Drawer from '../components/Drawer'
import { Link } from '../components/Link'
import ThemeToggle from '../components/ThemeToggle'
import { useMenuLateral } from '../hooks/useMenuLateral'
import { erp } from '../lib/erp'

export const SECOES = [
  { id: 'produtos', rotulo: 'Produtos' },
  { id: 'derivados', rotulo: 'Derivados' },
  { id: 'categorias', rotulo: 'Categorias' },
  { id: 'inicio', rotulo: 'Página inicial' },
  { id: 'banners', rotulo: 'Banners' },
  { id: 'ofertas', rotulo: 'Ofertas' },
  { id: 'empresa', rotulo: 'Dados da empresa' },
  { id: 'aparencia', rotulo: 'Aparência' },
  { id: 'paginas', rotulo: 'Páginas de texto' },
] as const

export type Aba = (typeof SECOES)[number]['id']

type Props = {
  aba: Aba
  onEscolher: (aba: Aba) => void
  /** Celular: menu em gaveta. Computador: coluna fixa ao lado do conteúdo. */
  mobile: boolean
  /** Botão de menu da barra do admin: recebe o foco quando a gaveta fecha. */
  botaoMenu: RefObject<HTMLElement | null>
}

/** Menu do admin: as seções, o tema, voltar à loja e sair. Aberto pelo histórico (chave `adminMenu`). */
export default function AdminMenu({ aba, onEscolher, mobile, botaoMenu }: Props) {
  const { aberto, fechar } = useMenuLateral('adminMenu')

  // Indo para o computador a gaveta some; sem fechar, o estado guardado no histórico reabriria o menu ao voltar ao celular
  useEffect(() => {
    if (!mobile && aberto) fechar()
  }, [mobile, aberto, fechar])

  function escolher(proxima: Aba) {
    onEscolher(proxima)
    if (mobile) fechar()
  }

  // Sair fecha a gaveta antes: o login que aparece depois não pode herdar o menu aberto
  function sair() {
    fechar()
    void erp.auth.signOut()
  }

  const itens = (
    <nav className="admin-menu" aria-label="Administração">
      <ul className="admin-menu-secoes">
        {SECOES.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="admin-menu-item"
              aria-current={aba === s.id ? 'page' : undefined}
              onClick={() => escolher(s.id)}
            >
              {s.rotulo}
            </button>
          </li>
        ))}
      </ul>
      <div className="admin-menu-rodape">
        <div className="admin-menu-linha">
          <span>Tema</span>
          <ThemeToggle />
        </div>
        <Link to="/" replace className="admin-menu-link">
          Voltar à loja
        </Link>
        <button type="button" className="admin-menu-link" onClick={sair}>
          Sair
        </button>
      </div>
    </nav>
  )

  if (!mobile) return itens

  return (
    <Drawer aberto={aberto} onFechar={fechar} rotulo="Menu da administração" devolverFocoPara={botaoMenu}>
      {itens}
    </Drawer>
  )
}
