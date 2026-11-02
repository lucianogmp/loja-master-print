import { useCallback, useContext, type RefAttributes } from 'react'
import {
  Link as LinkRR,
  NavLink as NavLinkRR,
  useNavigate,
  type LinkProps,
  type NavigateOptions,
  type NavLinkProps,
  type To,
} from 'react-router-dom'
import { ShellContext } from '../lib/telas'

// Links da loja: no celular pedem a animação nativa entre telas (View Transitions).
// Fora da casca da loja (login, administração) e no computador, navegam sem animar.
// Navegadores sem document.startViewTransition simplesmente trocam de tela na hora.

const useAnimar = () => useContext(ShellContext)?.ehMobile ?? false

export function Link({ viewTransition, ...props }: LinkProps & RefAttributes<HTMLAnchorElement>) {
  const animar = useAnimar()
  return <LinkRR viewTransition={viewTransition ?? animar} {...props} />
}

export function NavLink({ viewTransition, ...props }: NavLinkProps & RefAttributes<HTMLAnchorElement>) {
  const animar = useAnimar()
  return <NavLinkRR viewTransition={viewTransition ?? animar} {...props} />
}

export function useNavegar(): (to: To | number, opts?: NavigateOptions) => void {
  const navigate = useNavigate()
  const animar = useAnimar()
  return useCallback(
    (to: To | number, opts?: NavigateOptions) => {
      if (typeof to === 'number') return void navigate(to)
      const opcoes = animar ? { ...opts, viewTransition: true } : opts
      return void (opcoes ? navigate(to, opcoes) : navigate(to))
    },
    [navigate, animar],
  )
}
