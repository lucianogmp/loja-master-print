import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Compartilhar from './Compartilhar'

describe('Compartilhar', () => {
  it('sem folha do aparelho, abre o menu com WhatsApp e copiar link', async () => {
    render(<Compartilhar titulo="Cartão de visita" />)
    await userEvent.click(screen.getByRole('button', { name: /compartilhar/i }))
    const zap = screen.getByRole('menuitem', { name: /whatsapp/i })
    expect(zap.getAttribute('href')).toContain('https://wa.me/?text=')
    expect(zap.getAttribute('href')).toContain(encodeURIComponent('Cartão de visita'))
    expect(screen.getByRole('menuitem', { name: /copiar link/i })).toBeInTheDocument()
  })
})
