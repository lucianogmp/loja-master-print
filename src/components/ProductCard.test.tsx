import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirRpc, linhasCatalogo } from '../test/fakes'

describe('Cartão de produto', () => {
  it('UT-423 mostra o prazo do ERP e o selo "Arte pronta" só no produto derivado', async () => {
    const [comum, derivado] = linhasCatalogo([{ slug: 'cartoes', nome: 'Cartões' }]).concat(
      linhasCatalogo([{ slug: 'banners', nome: 'Banners' }]),
    ) as Record<string, unknown>[]
    definirRpc('loja_catalogo_v2', [comum, { ...derivado, derivado_id: 'd1', prazo_entrega_dias: 1 }])
    renderComTudo({ rota: '/produtos' })
    const selos = await screen.findAllByText('Arte pronta')
    expect(selos).toHaveLength(1)
    expect(screen.getByText('Produção em 3 dias úteis')).toBeInTheDocument()
    expect(screen.getByText('Produção em 1 dia útil')).toBeInTheDocument()
  })
})
