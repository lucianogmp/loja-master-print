import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { logada } from '../test/dados'
import { supabaseFake } from '../test/fakes'

const A = supabaseFake.auth
const NEUTRO = 'Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.'

describe('EsqueciSenha', () => {
  afterEach(() => vi.useRealTimers())

  it('UT-229 e-mail pré-preenchido', async () => {
    renderComTudo({ rota: '/esqueci-senha?email=a%40b.c' })
    expect(await screen.findByLabelText('E-mail')).toHaveValue('a@b.c')
  })

  it('UT-230 envia com redirectTo e mostra texto neutro', async () => {
    const { usuario } = renderComTudo({ rota: '/esqueci-senha?email=a%40b.c&voltar=%2Fcheckout' })
    await usuario.click(await screen.findByRole('button', { name: 'Enviar link' }))
    expect(A.resetPasswordForEmail).toHaveBeenCalledWith('a@b.c', { redirectTo: `${window.location.origin}/redefinir-senha?voltar=%2Fcheckout` })
    expect(await screen.findByText(NEUTRO)).toBeInTheDocument()
  })

  it('UT-231 e-mail inválido', async () => {
    const { usuario } = renderComTudo({ rota: '/esqueci-senha?email=abc' })
    await usuario.click(await screen.findByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(A.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('UT-232 e-mail desconhecido → mesmo texto', async () => {
    const { usuario } = renderComTudo({ rota: '/esqueci-senha?email=nao%40existe.com' })
    await usuario.click(await screen.findByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText(NEUTRO)).toBeInTheDocument()
  })

  it('UT-233 limite de tentativas → sem texto neutro', async () => {
    A.resetPasswordForEmail.mockResolvedValueOnce({ data: null, error: { message: 'email rate limit exceeded' } })
    const { usuario } = renderComTudo({ rota: '/esqueci-senha?email=a%40b.c' })
    await usuario.click(await screen.findByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText(/Muitas tentativas/)).toBeInTheDocument()
    expect(screen.queryByText(NEUTRO)).toBeNull()
  })

  it('UT-234 logada → Segurança', async () => {
    const { router } = renderComTudo({ rota: '/esqueci-senha' }, { sessao: logada() })
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/seguranca'))
  })

  it('UT-235 Reenviar desabilitado durante a contagem e liberado em 0', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { usuario } = renderComTudo({ rota: '/esqueci-senha?email=a%40b.c' })
    await usuario.click(await screen.findByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByRole('button', { name: /Reenviar/ })).toBeDisabled()
    act(() => void vi.advanceTimersByTime(61_000))
    expect(screen.getByRole('button', { name: 'Reenviar' })).toBeEnabled()
  })

  it('UT-236 falha de rede → Sem conexão, campo mantido', async () => {
    A.resetPasswordForEmail.mockRejectedValueOnce(new Error('rede'))
    const { usuario } = renderComTudo({ rota: '/esqueci-senha?email=a%40b.c' })
    await usuario.click(await screen.findByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText('Sem conexão. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@b.c')
  })
})
