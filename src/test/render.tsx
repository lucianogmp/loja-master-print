import { isValidElement, type ReactElement } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, type InitialEntry, type RouteObject } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AuthProvider } from '../lib/auth'
import { SiteProvider } from '../lib/site'
import { CatalogoProvider } from '../lib/catalogo'
import { CartProvider } from '../lib/cart'
import { ShellContext } from '../lib/telas'
import { rotas } from '../rotas'
import Raiz from '../components/Raiz'
import LojaShell from '../components/LojaShell'
import { definirMidia } from './matchMedia'
import { erpFake, supabaseFake } from './fakes'

type Opcoes = {
  /** Viewport de celular (padrão) ou computador. */
  mobile?: boolean
  /** Sessão do comprador já existente ao abrir. */
  sessao?: Session | null
  /** Sessão do ERP (administração). */
  sessaoErp?: Session | null
  /** Entradas do histórico; a última é a tela aberta. */
  historico?: InitialEntry[]
  /** Só para um componente avulso: monta-o dentro da LojaShell de verdade (cabeçalho, rodapé…). */
  casca?: boolean
  /** Rotas extras só para o teste, dentro da LojaShell (ex.: telas de outra tarefa que ainda não existem). */
  rotasExtras?: RouteObject[]
}

/** Põe `extras` como filhas da LojaShell dentro da árvore dada. */
function comExtras(arvore: RouteObject[], extras: RouteObject[]): RouteObject[] {
  return arvore.map((r) => {
    if (isValidElement(r.element) && r.element.type === LojaShell) return { ...r, children: [...extras, ...(r.children ?? [])] } as RouteObject
    return (r.children ? { ...r, children: comExtras(r.children, extras) } : r) as RouteObject
  })
}

/**
 * Renderiza com os provedores reais e um roteador em memória.
 * - `{ rota }`: a árvore de rotas real de src/rotas.tsx, aberta em `rota`.
 * - um elemento: montado em `*` sob a `Raiz` (e sob a `LojaShell` com `casca: true`).
 */
export function renderComTudo(
  alvo: ReactElement | { rota: string },
  { mobile = true, sessao = null, sessaoErp = null, historico, casca = false, rotasExtras }: Opcoes = {},
) {
  definirMidia({ mobile })
  supabaseFake.auth.sessao = sessao
  erpFake.auth.sessao = sessaoErp

  let rotasTeste: RouteObject[]
  let entradas: InitialEntry[]
  if (isValidElement(alvo)) {
    const pagina = casca ? (
      alvo
    ) : (
      <ShellContext.Provider value={{ ehMobile: mobile, handle: undefined, titulo: undefined }}>{alvo}</ShellContext.Provider>
    )
    const folha: RouteObject = { path: '*', element: pagina }
    rotasTeste = [{ element: <Raiz />, children: casca ? [{ element: <LojaShell />, children: [folha] }] : [folha] }]
    entradas = historico ?? ['/']
  } else {
    rotasTeste = rotasExtras ? comExtras(rotas, rotasExtras) : rotas
    entradas = historico ?? [(alvo as { rota: string }).rota]
  }

  const router = createMemoryRouter(rotasTeste, { initialEntries: entradas, initialIndex: entradas.length - 1 })
  const usuario = userEvent.setup()
  const resultado = render(
    <AuthProvider>
      <SiteProvider>
        <CatalogoProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </CatalogoProvider>
      </SiteProvider>
    </AuthProvider>,
  )
  return { ...resultado, router, usuario }
}
