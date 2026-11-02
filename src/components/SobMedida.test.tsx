import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearCatalogo } from '../test/dados'
import { mensagemSobMedida } from './SobMedida'

describe('Orçamento sob medida', () => {
  it('UT-421 mensagem leva produto, medida e quantidade; sem nada vira pedido genérico', () => {
    expect(mensagemSobMedida({ produto: 'Banner em lona', largura: '100', altura: '50,5', quantidade: '2' })).toBe(
      'Olá! Quero um orçamento: Banner em lona, medida 100 x 50.5 cm, 2 unidades.',
    )
    expect(mensagemSobMedida({ produto: '', largura: '', altura: '', quantidade: '' })).toBe(
      'Olá! Quero um orçamento: um produto sob medida, 1 unidade.',
    )
  })

  it('UT-422 Início sem imagem própria mostra o orçamento no destaque e o link já leva a medida', async () => {
    semearCatalogo()
    renderComTudo({ rota: '/' })
    const form = await screen.findByRole('form', { name: 'Orçamento sob medida' })
    fireEvent.change(screen.getByLabelText('Largura (cm)'), { target: { value: '120' } })
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '80' } })
    const link = screen.getByRole('link', { name: /Pedir orçamento no WhatsApp/ })
    expect(form).toContainElement(link)
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('medida 120 x 80 cm')
    expect(await screen.findByText('Produção a partir de 3 dias úteis')).toBeInTheDocument()
  })
})
