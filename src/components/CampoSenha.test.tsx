import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CampoSenha from './CampoSenha'

describe('CampoSenha', () => {
  it('UT-175 alterna entre senha e texto', async () => {
    render(<CampoSenha id="s" />)
    const campo = document.getElementById('s') as HTMLInputElement
    expect(campo.type).toBe('password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(campo.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument()
  })

  it('UT-176 mantém o valor ao alternar', async () => {
    render(<CampoSenha id="s" />)
    const campo = document.getElementById('s') as HTMLInputElement
    await userEvent.type(campo, 'abc123')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(campo).toHaveValue('abc123')
  })

  it('UT-177 repassa os atributos ao input', () => {
    render(<CampoSenha id="s" autoComplete="new-password" required minLength={8} />)
    const campo = document.getElementById('s') as HTMLInputElement
    expect(campo).toHaveAttribute('autocomplete', 'new-password')
    expect(campo).toBeRequired()
    expect(campo).toHaveAttribute('minlength', '8')
  })
})
