import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirMidia } from '../test/matchMedia'
import { logada, semearCatalogo } from '../test/dados'
import { useTitulo } from '../lib/telas'
import { useShell } from './LojaShell'

function MostraTitulo() {
  const { titulo } = useShell()
  return <p data-testid="titulo">{titulo ?? '(nenhum)'}</p>
}

function ComTitulo({ titulo }: { titulo: string }) {
  useTitulo(titulo)
  return null
}

describe('useTitulo / TelaProvider', () => {
  it('UT-361 a página define o título da casca', () => {
    renderComTudo(
      <>
        <ComTitulo titulo="X" />
        <MostraTitulo />
      </>,
      { casca: true },
    )
    expect(screen.getByTestId('titulo')).toHaveTextContent('X')
  })

  it('UT-362 ao mudar de caminho o título zera até alguém definir de novo', async () => {
    const { router } = renderComTudo(
      <>
        <ComTitulo titulo="X" />
        <MostraTitulo />
      </>,
      { casca: true, historico: ['/a'] },
    )
    expect(screen.getByTestId('titulo')).toHaveTextContent('X')
    await act(() => router.navigate('/b'))
    expect(screen.getByTestId('titulo')).toHaveTextContent('(nenhum)')
  })

  it('UT-363 a página que definiu o título sai → título zera', async () => {
    function Alterna() {
      const [mostrar, setMostrar] = useState(true)
      return (
        <>
          {mostrar && <ComTitulo titulo="X" />}
          <button onClick={() => setMostrar(false)}>sair</button>
          <MostraTitulo />
        </>
      )
    }
    const { usuario } = renderComTudo(<Alterna />, { casca: true })
    expect(screen.getByTestId('titulo')).toHaveTextContent('X')
    await usuario.click(screen.getByRole('button', { name: 'sair' }))
    expect(screen.getByTestId('titulo')).toHaveTextContent('(nenhum)')
  })
})

describe('LojaShell', () => {
  it('UT-369 computador → cabeçalho e rodapé, sem barra inferior', async () => {
    const { container } = renderComTudo({ rota: '/' }, { mobile: false })
    expect(container.querySelector('header.header')).not.toBeNull()
    expect(container.querySelector('footer')).not.toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull()
  })

  it('UT-373 classe da casca acompanha o viewport', () => {
    const celular = renderComTudo({ rota: '/' }, { mobile: true })
    expect(celular.container.querySelector('.shell')).toHaveClass('shell-mobile')
    expect(celular.container.querySelector('.shell')).not.toHaveClass('shell-desktop')
    celular.unmount()

    const computador = renderComTudo({ rota: '/' }, { mobile: false })
    expect(computador.container.querySelector('.shell')).toHaveClass('shell-desktop')
    expect(computador.container.querySelector('.shell')).not.toHaveClass('shell-mobile')
  })
})

describe('LojaShell (celular)', () => {
  it('UT-370 barra do alto e barra inferior; sem cabeçalho nem rodapé', () => {
    const { container } = renderComTudo({ rota: '/' })
    expect(container.querySelector('.barra-topo-app')).not.toBeNull()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
    expect(container.querySelector('header.header')).toBeNull()
    expect(container.querySelector('footer')).toBeNull()
  })

  it('UT-371 virar computador com o menu aberto: menu some, cabeçalho volta, URL intacta', async () => {
    semearCatalogo()
    const { router, container } = renderComTudo({ rota: '/produtos?categoria=a' })
    await act(() => router.navigate('/produtos?categoria=a', { state: { menu: true } }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    act(() => definirMidia({ mobile: false }))
    await waitFor(() => expect(container.querySelector('header.header')).not.toBeNull())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(router.state.location.pathname + router.state.location.search).toBe('/produtos?categoria=a')
  })

  it('UT-372 o conteúdo reserva a barra, menos no checkout', () => {
    const { container, unmount } = renderComTudo({ rota: '/' })
    expect(container.querySelector('main.tela')).toHaveClass('com-barra')
    unmount()
    const outra = renderComTudo({ rota: '/checkout' })
    expect(outra.container.querySelector('main.tela')).not.toHaveClass('com-barra')
  })

  it('UT-374 página inexistente: barra à mostra, nenhuma aba atual e título certo', () => {
    const { container } = renderComTudo({ rota: '/nao-existe' })
    const barra = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(within(barra).getAllByRole('link').filter((a) => a.hasAttribute('aria-current'))).toHaveLength(0)
    expect(container.querySelector('header.barra-topo-app h1')).toHaveTextContent('Página não encontrada')
  })

  it('IT-002 computador ↔ celular mantém a URL', async () => {
    semearCatalogo()
    const { container, router } = renderComTudo({ rota: '/produtos?categoria=b' }, { mobile: false })
    expect(container.querySelector('header.header .categorias')).not.toBeNull()
    act(() => definirMidia({ mobile: true }))
    await waitFor(() => expect(container.querySelector('.barra-topo-app')).not.toBeNull())
    const barra = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(within(barra).getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
    expect(router.state.location.pathname + router.state.location.search).toBe('/produtos?categoria=b')
    act(() => definirMidia({ mobile: false }))
    await waitFor(() => expect(container.querySelector('header.header')).not.toBeNull())
    expect(router.state.location.search).toBe('?categoria=b')
  })

  it('IT-006 trocar de aba leva ao topo; voltar de um detalhe restaura a rolagem', async () => {
    const rolar = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    const { usuario, router } = renderComTudo({ rota: '/' }, { sessao: logada() })
    rolar(500)
    await usuario.click(within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', { name: 'Pedidos' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pedidos'))
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0)
    rolar(700)
    await act(() => router.navigate('/pedidos/12'))
    rolar(0)
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/pedidos')
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 700)
    window.dispatchEvent(new Event('pagehide'))
    // o mapa de posições do roteador guarda uma chave por entrada visitada (início, pedidos, detalhe)
    expect(Object.keys(JSON.parse(sessionStorage.getItem('react-router-scroll-positions') ?? '{}'))).toHaveLength(3)
    Reflect.deleteProperty(window, 'scrollY')
  })
})
