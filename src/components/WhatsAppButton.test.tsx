import { describe, expect, it } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearConfig } from '../test/dados'

const botao = () => document.querySelector('.whatsapp-flutuante')

describe('WhatsAppButton', () => {
  it('UT-171 sem número configurado → nada', async () => {
    semearConfig({ whatsapp: '' })
    renderComTudo({ rota: '/' })
    await waitFor(() => expect(botao()).toBeNull())
  })

  it('UT-172 checkout (sem barra) → nada', () => {
    renderComTudo({ rota: '/checkout' })
    expect(botao()).toBeNull()
  })

  it('UT-173 menu aberto → nada', async () => {
    const { usuario } = renderComTudo({ rota: '/' })
    expect(botao()).not.toBeNull()
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(botao()).toBeNull()
  })

  it('UT-174 computador: link para o WhatsApp em nova aba', () => {
    renderComTudo({ rota: '/' }, { mobile: false })
    expect(botao()).toHaveAttribute('target', '_blank')
  })

  it('IT-025 some no checkout e no login, volta no início', async () => {
    const { router } = renderComTudo({ rota: '/' })
    expect(botao()).not.toBeNull()
    await act(() => router.navigate('/checkout'))
    expect(botao()).toBeNull()
    await act(() => router.navigate('/entrar'))
    expect(botao()).toBeNull()
    await act(() => router.navigate('/'))
    expect(botao()).not.toBeNull()
  })
})
