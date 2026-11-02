import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearCarrinho, semearCatalogo } from '../test/dados'

const barra = () => screen.getByRole('navigation', { name: 'Navegação principal' })

describe('Carrinho (raiz da aba)', () => {
  it('UT-329 vazio: mensagem e Ver produtos', async () => {
    const { usuario, router } = renderComTudo({ rota: '/carrinho' })
    expect(screen.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('link', { name: 'Ver produtos' }))
    expect(router.state.location.pathname).toBe('/produtos')
  })

  it('UT-330 remover uma linha atualiza o contador da barra', async () => {
    semearCatalogo()
    semearCarrinho(['produto-a', 'produto-b'])
    const { usuario } = renderComTudo({ rota: '/carrinho' })
    await screen.findAllByRole('button', { name: 'Remover' })
    expect(barra().querySelector('.contador')).toHaveTextContent('2')
    await usuario.click(screen.getAllByRole('button', { name: 'Remover' })[0])
    await waitFor(() => expect(barra().querySelector('.contador')).toHaveTextContent('1'))
  })

  it('UT-375 carrinho guardado corrompido começa vazio', () => {
    localStorage.setItem('master-print-carrinho', '{oops')
    renderComTudo({ rota: '/carrinho' })
    expect(screen.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument()
    expect(within(barra()).getByRole('link', { name: 'Carrinho' })).toBeInTheDocument()
    expect(barra().querySelector('.contador')).toBeNull()
  })

  it('UT-400 linha de produto que saiu do catálogo: Produto indisponível com Remover, fora do subtotal', async () => {
    semearCatalogo()
    semearCarrinho(['sumiu'])
    const { usuario } = renderComTudo({ rota: '/carrinho' })
    expect(await screen.findByText('Produto indisponível')).toBeInTheDocument()
    expect(screen.getByText('Subtotal').parentElement).toHaveTextContent(/0,00/)
    await usuario.click(screen.getByRole('button', { name: 'Remover' }))
    expect(screen.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument()
  })
})
