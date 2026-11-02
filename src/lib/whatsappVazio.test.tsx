import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearCatalogo } from '../test/dados'

// Número vazio na configuração = nenhum link wa.me aparece na loja
vi.mock('./site', async (original) => {
  const real = await original<typeof import('./site')>()
  return {
    ...real,
    useSite: () => {
      const s = real.useSite()
      return { ...s, empresa: { ...s.empresa, whatsapp: '' } }
    },
  }
})

describe('WhatsApp não configurado', () => {
  it('UT-415 Header e Footer do computador não têm link para o WhatsApp', () => {
    const { container } = renderComTudo({ rota: '/atendimento' }, { mobile: false })
    expect(container.querySelector('a[href*="wa.me"]')).toBeNull()
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull()
  })

  it('UT-416 página de produto não tem link para o WhatsApp', async () => {
    semearCatalogo()
    const { container } = renderComTudo({ rota: '/produto/produto-a' })
    await screen.findByRole('button', { name: 'Adicionar ao carrinho' })
    expect(container.querySelector('a[href*="wa.me"]')).toBeNull()
  })
})
