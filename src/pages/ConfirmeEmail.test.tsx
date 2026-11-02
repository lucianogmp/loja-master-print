import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { supabaseFake } from '../test/fakes'

const A = supabaseFake.auth
const comEmail = (url = '/confirme-email') => [{ pathname: url.split('?')[0], search: url.includes('?') ? '?' + url.split('?')[1] : '', state: { email: 'a@b.c' } }]

describe('ConfirmeEmail', () => {
  it('UT-224 mostra o e-mail', async () => {
    renderComTudo({ rota: '/confirme-email' }, { historico: comEmail() })
    expect(await screen.findByText('Confira seu e-mail')).toBeInTheDocument()
    expect(screen.getByText('a@b.c')).toBeInTheDocument()
  })

  it('UT-225 reenviar → aviso e contagem', async () => {
    const { usuario } = renderComTudo({ rota: '/confirme-email' }, { historico: comEmail('/confirme-email?voltar=%2Fcheckout') })
    await usuario.click(await screen.findByRole('button', { name: 'Reenviar e-mail' }))
    expect(A.resend).toHaveBeenCalledWith({ type: 'signup', email: 'a@b.c', options: { emailRedirectTo: `${window.location.origin}/checkout` } })
    expect(await screen.findByText('E-mail reenviado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reenviar e-mail/ }).textContent).toContain('60')
  })

  it('UT-226 sem state → texto genérico', async () => {
    renderComTudo({ rota: '/confirme-email' })
    expect(await screen.findByText('Confira seu e-mail')).toBeInTheDocument()
    expect(screen.queryByText('a@b.c')).toBeNull()
    expect(screen.getByRole('link', { name: 'Voltar para entrar' })).toBeInTheDocument()
  })

  it('UT-227 erro ao reenviar → mensagem e botão ativo', async () => {
    A.resend.mockResolvedValueOnce({ data: null, error: { message: 'x' } })
    const { usuario } = renderComTudo({ rota: '/confirme-email' }, { historico: comEmail() })
    await usuario.click(await screen.findByRole('button', { name: 'Reenviar e-mail' }))
    expect(await screen.findByText('Não foi possível reenviar. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeEnabled()
  })

  it('UT-228 Voltar para entrar carrega voltar', async () => {
    renderComTudo({ rota: '/confirme-email?voltar=%2Fcheckout' })
    expect(await screen.findByRole('link', { name: 'Voltar para entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fcheckout')
  })
})
