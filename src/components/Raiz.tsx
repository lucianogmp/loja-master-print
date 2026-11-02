import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation, useMatches, useNavigationType } from 'react-router-dom'
import { useNavegar } from './Link'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { CONSULTA_MOBILE, direcaoTransicao, handleAtual, TelaProvider, type Handle } from '../lib/telas'

/** Elemento raiz de todas as rotas: rolagem por entrada do histórico, sentido da animação e ajustes ao abrir o site. */
export default function Raiz() {
  const location = useLocation()
  const tipo = useNavigationType()
  const handle = handleAtual(useMatches())
  const ehMobile = useMediaQuery(CONSULTA_MOBILE)
  const navegar = useNavegar()
  const anterior = useRef<Handle | undefined>(undefined)
  const aviso = (location.state as { aviso?: string } | null)?.aviso
  const [avisoVisivel, setAvisoVisivel] = useState(false)

  // Aviso passageiro enviado por outra tela (ex.: 'Senha alterada'), sumindo sozinho
  useEffect(() => {
    if (!aviso) return setAvisoVisivel(false)
    setAvisoVisivel(true)
    const id = setTimeout(() => setAvisoVisivel(false), 5000)
    return () => clearTimeout(id)
  }, [aviso, location.key])

  // O CSS das transições lê html[data-transicao] (push · pop · nenhuma)
  useLayoutEffect(() => {
    document.documentElement.dataset.transicao = direcaoTransicao(tipo, anterior.current, handle, ehMobile)
    anterior.current = handle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    // Link de e-mail vencido/inválido chega como #error_code=… em qualquer página.
    // A tela de nova senha trata o próprio erro; nas outras, leva para o login com o aviso.
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''))
    if (hash.get('error_code') && location.pathname !== '/redefinir-senha') {
      navegar('/entrar?aviso=link-expirado', { replace: true })
      return
    }
    // Entrada antiga do menu lateral (ex.: depois de recarregar) não deve reabrir o menu
    if ((location.state as { menu?: unknown } | null)?.menu)
      navegar(location.pathname + location.search + location.hash, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TelaProvider>
      <Outlet />
      {aviso && avisoVisivel && <p className="aviso aviso-flutuante" role="status">{aviso}</p>}
      <ScrollRestoration />
    </TelaProvider>
  )
}
