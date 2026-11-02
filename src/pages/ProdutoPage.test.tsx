import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearCatalogo } from '../test/dados'

// Quem chega por link abre o produto antes de o catálogo carregar: a variação tem de valer assim que ele chega.
describe('Página de produto aberta por link', () => {
  it('UT-417 calcula o total e libera "Adicionar ao carrinho" depois que o catálogo carrega', async () => {
    semearCatalogo()
    renderComTudo({ rota: '/produto/produto-a' })
    const botao = await screen.findByRole('button', { name: 'Adicionar ao carrinho' })
    expect(botao).toBeEnabled()
    expect(screen.queryByText('—')).toBeNull()
    expect(screen.queryByText(/Preço de exemplo/)).toBeNull()
  })
})
