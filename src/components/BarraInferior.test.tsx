import { describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirMidia } from '../test/matchMedia'
import { logada, semearCarrinho } from '../test/dados'

const barra = () => screen.getByRole('navigation', { name: 'Navegação principal' })
const abas = () => within(barra()).getAllByRole('link')

describe('BarraInferior', () => {
  it('UT-097 cinco abas na ordem fixa, com os destinos certos', () => {
    renderComTudo({ rota: '/' })
    expect(abas().map((a) => a.textContent)).toEqual(['Início', 'Buscar', 'Carrinho', 'Pedidos', 'Conta'])
    expect(abas().map((a) => a.getAttribute('href'))).toEqual(['/', '/buscar', '/carrinho', '/pedidos', '/conta'])
  })

  it('UT-097b trocar de aba não pede View Transition', async () => {
    const iniciar = vi.fn()
    Object.defineProperty(document, 'startViewTransition', { value: iniciar, configurable: true })
    try {
      const { usuario } = renderComTudo({ rota: '/' })
      await usuario.click(within(barra()).getByRole('link', { name: 'Buscar' }))
      expect(iniciar).not.toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(document, 'startViewTransition')
    }
  })

  it('UT-098 a aba dona da tela fica atual (pedido → Pedidos; produto → Buscar)', () => {
    const { unmount } = renderComTudo({ rota: '/pedidos/7' }, )
    expect(within(barra()).getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page')
    unmount()
    renderComTudo({ rota: '/produto/x' })
    expect(within(barra()).getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
  })

  it('UT-099 página de texto não destaca aba', () => {
    renderComTudo({ rota: '/pagina/sobre' })
    expect(abas().filter((a) => a.hasAttribute('aria-current'))).toHaveLength(0)
  })

  it('UT-100 carrinho vazio → sem contador', () => {
    renderComTudo({ rota: '/' })
    expect(barra().querySelector('.contador')).toBeNull()
  })

  it('UT-101 contador já certo no primeiro render', () => {
    semearCarrinho(['a', 'b', 'c'])
    renderComTudo({ rota: '/' })
    expect(barra().querySelector('.contador')).toHaveTextContent('3')
  })

  it.each([
    [10, '9+'],
    [9, '9'],
  ])('UT-102 %i linhas → %s', (n, texto) => {
    semearCarrinho(Array.from({ length: n }, (_, i) => `p${i}`))
    renderComTudo({ rota: '/' })
    expect(barra().querySelector('.contador')).toHaveTextContent(texto)
  })

  it.each([
    [3, 'Carrinho, 3 itens'],
    [1, 'Carrinho, 1 item'],
  ])('UT-103 nome acessível com %i linha(s)', (n, nome) => {
    semearCarrinho(Array.from({ length: n }, (_, i) => `p${i}`))
    renderComTudo({ rota: '/' })
    expect(within(barra()).getByRole('link', { name: nome })).toBeInTheDocument()
  })

  it('UT-104 conta: avatar com login, ícone sem login', async () => {
    const { unmount } = renderComTudo({ rota: '/' }, { sessao: logada() })
    await waitFor(() => expect(abas()[4].querySelector('.avatar-p')).not.toBeNull())
    expect(abas()[4].querySelector('.avatar-p')).not.toBeNull()
    unmount()
    renderComTudo({ rota: '/' })
    expect(abas()[4].querySelector('.avatar')).toBeNull()
    expect(abas()[4].querySelector('svg')).not.toBeNull()
  })

  it('UT-105 checkout (sem barra) → nada', () => {
    renderComTudo({ rota: '/checkout' })
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull()
  })

  it('UT-106 computador → nada', () => {
    renderComTudo({ rota: '/' }, { mobile: false })
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull()
  })

  it('UT-107 aba ativa na raiz: sobe ao topo sem mudar de tela', async () => {
    const { router, usuario } = renderComTudo({ rota: '/pedidos' }, { sessao: logada() })
    window.scrollY = 400
    await usuario.click(within(barra()).getByRole('link', { name: 'Pedidos' }))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(router.state.location.pathname).toBe('/pedidos')
  })

  it('UT-108 aba ativa numa subpágina: abre a raiz', async () => {
    const { router, usuario } = renderComTudo({ rota: '/pedidos/7' }, { sessao: logada() })
    await usuario.click(within(barra()).getByRole('link', { name: 'Pedidos' }))
    expect(router.state.location.pathname).toBe('/pedidos')
  })

  it('UT-109 movimento reduzido → rolagem sem suavizar', async () => {
    definirMidia({ reduzido: true })
    const { usuario } = renderComTudo({ rota: '/' })
    await usuario.click(within(barra()).getByRole('link', { name: 'Início' }))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('UT-110 landmark de navegação principal', () => {
    renderComTudo({ rota: '/' })
    expect(barra().tagName).toBe('NAV')
  })

  it('UT-111 dois toques seguidos em Buscar abrem uma tela só', async () => {
    const { router } = renderComTudo({ rota: '/' })
    const buscar = within(barra()).getByRole('link', { name: 'Buscar' })
    await act(async () => {
      buscar.click()
      buscar.click()
    })
    expect(router.state.location.pathname).toBe('/buscar')
    // uma entrada só: um "voltar" já chega no início
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/')
  })
})
