import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearCatalogo, semearConfig } from '../test/dados'

const tituloDaBarra = (c: HTMLElement) => c.querySelector('header.barra-topo-app h1')

describe('Início, catálogo e produto no celular', () => {
  it('UT-364 Início: mensagem de atendimento e depois as fichas, antes de tudo', async () => {
    semearCatalogo()
    semearConfig()
    const { container } = renderComTudo({ rota: '/' })
    await waitFor(() => expect(container.querySelector('main > .chips')).not.toBeNull())
    const filhos = [...container.querySelector('main')!.children]
    expect(filhos[0]).toHaveClass('mensagem-atendimento')
    expect(filhos[1]).toHaveClass('chips')
  })

  it('UT-365 computador: nem mensagem nem fichas', async () => {
    semearCatalogo()
    const { container } = renderComTudo({ rota: '/' }, { mobile: false })
    await screen.findByText('A', { selector: '.categorias a' })
    expect(container.querySelector('.mensagem-atendimento')).toBeNull()
    expect(container.querySelector('.chips')).toBeNull()
  })

  it('UT-366 catálogo: fichas com a categoria da URL ativa', async () => {
    semearCatalogo()
    const { container } = renderComTudo({ rota: '/produtos?categoria=b' })
    await waitFor(() => expect(container.querySelector('.chips a.ativo')).toHaveTextContent('B'))
  })

  it.each([
    ['/produtos?categoria=b', 'B'],
    ['/produtos?busca=x', 'Resultados'],
    ['/produtos', 'Produtos'],
  ])('UT-367 título do catálogo em %s → %s', async (rota, titulo) => {
    semearCatalogo()
    const { container } = renderComTudo({ rota })
    await waitFor(() => expect(tituloDaBarra(container)).toHaveTextContent(titulo))
  })

  it('UT-368 produto: "Produto" enquanto carrega e depois o nome', async () => {
    semearCatalogo()
    const { container } = renderComTudo({ rota: '/produto/produto-b' })
    expect(tituloDaBarra(container)).toHaveTextContent('Produto')
    await waitFor(() => expect(tituloDaBarra(container)).toHaveTextContent('Produto B'))
  })
})
