import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Menu lateral guardado no histórico: abrir empilha a mesma tela com `state.menu`, então o gesto de voltar do aparelho
 * só fecha o menu. Links dentro do menu navegam com `replace` para não deixar essa entrada para trás.
 * `chave` permite outro painel (ex.: menu do admin) sem conflitar com o da loja.
 */
export function useMenuLateral(chave = 'menu'): { aberto: boolean; abrir(): void; fechar(): void } {
  const navigate = useNavigate()
  const { state, pathname, search, hash } = useLocation()
  const aberto = (state as Record<string, unknown> | null)?.[chave] === true

  const abrir = useCallback(() => {
    // Caminho explícito: '.' dentro da casca (rota sem path) resolveria para '/', não para a tela atual
    if (!aberto) navigate({ pathname, search, hash }, { state: { [chave]: true }, preventScrollReset: true })
  }, [navigate, aberto, chave, pathname, search, hash])
  const fechar = useCallback(() => {
    if (aberto) navigate(-1)
  }, [navigate, aberto])
  return { aberto, abrir, fechar }
}
