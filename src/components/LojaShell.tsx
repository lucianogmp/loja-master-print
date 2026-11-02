import { useContext, useMemo, useRef } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { CONSULTA_MOBILE, handleAtual, ShellContext, useTituloDaTela, type Shell } from '../lib/telas'
import Header from './Header'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import BarraTopo from './BarraTopo'
import BarraInferior from './BarraInferior'
import MenuLateral from './MenuLateral'

/** Casca de todas as telas da loja. Decide celular × computador e expõe isso (com o handle da rota) via useShell(). */
export default function LojaShell() {
  const ehMobile = useMediaQuery(CONSULTA_MOBILE)
  const handle = handleAtual(useMatches())
  const titulo = useTituloDaTela()
  const shell = useMemo<Shell>(() => ({ ehMobile, handle, titulo }), [ehMobile, handle, titulo])
  // No celular, o conteúdo deixa espaço para a barra inferior (exceto em telas sem barra, como o checkout)
  const comBarra = ehMobile && !handle?.semBarra
  const botaoMenu = useRef<HTMLButtonElement>(null)

  return (
    <ShellContext.Provider value={shell}>
      {ehMobile ? (
        <div className="shell shell-mobile">
          <BarraTopo botaoMenu={botaoMenu} />
          <main className={comBarra ? 'tela com-barra' : 'tela'}>
            <Outlet />
          </main>
          <BarraInferior />
          <MenuLateral botaoMenu={botaoMenu} />
          <WhatsAppButton />
        </div>
      ) : (
        <div className="shell shell-desktop">
          <Header />
          <main className="tela">
            <Outlet />
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      )}
    </ShellContext.Provider>
  )
}

export function useShell(): Shell {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell precisa estar dentro de LojaShell')
  return shell
}
