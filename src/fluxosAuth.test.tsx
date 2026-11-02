import { describe, expect, it } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderComTudo } from './test/render'
import { semearCatalogo } from './test/dados'
import { sessaoFake, supabaseFake } from './test/fakes'

const A = supabaseFake.auth

describe('fluxos de autenticação', () => {
  it('IT-008 entra a partir de /produtos e volta sem /entrar no histórico', async () => {
    semearCatalogo()
    const { usuario, router } = renderComTudo({ rota: '/produtos' }, { mobile: false })
    await usuario.click(await screen.findByRole('link', { name: /Entrar/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.search).toBe('?voltar=%2Fprodutos')
    await usuario.type(screen.getByLabelText('E-mail'), 'a@b.c')
    await usuario.type(document.getElementById('senha') as HTMLElement, 'x')
    A.signInWithPassword.mockImplementationOnce(async () => {
      A.emitir('SIGNED_IN', sessaoFake())
      return { data: {}, error: null }
    })
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/produtos'))
    await act(async () => void router.navigate(-1))
    expect(router.state.location.pathname).not.toBe('/entrar')
  })

  it('IT-009 cadastro → Confirme → reenviar', async () => {
    const { usuario, router } = renderComTudo({ rota: '/cadastro?voltar=%2Fcheckout' })
    await usuario.type(await screen.findByLabelText('Nome'), 'Ana Souza')
    await usuario.type(screen.getByLabelText('WhatsApp'), '11999999999')
    await usuario.type(screen.getByLabelText('E-mail'), 'a@b.c')
    await usuario.type(document.getElementById('senha') as HTMLElement, 'Senha123')
    await usuario.click(screen.getByRole('checkbox'))
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/confirme-email'))
    expect(router.state.location.search).toBe('?voltar=%2Fcheckout')
    expect(await screen.findByText('a@b.c')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Reenviar e-mail' }))
    const [arg] = A.resend.mock.calls[0] as unknown as [{ options: { emailRedirectTo: string } }]
    expect(arg.options.emailRedirectTo.endsWith('/checkout')).toBe(true)
  })

  it('IT-010 Esqueci minha senha a partir de /entrar', async () => {
    const { usuario, router } = renderComTudo({ rota: '/entrar' })
    await usuario.type(await screen.findByLabelText('E-mail'), 'a@b.c')
    await usuario.click(screen.getByRole('link', { name: 'Esqueci minha senha' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/esqueci-senha'))
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@b.c')
    await usuario.click(screen.getByRole('button', { name: 'Enviar link' }))
    const [, opcoes] = A.resetPasswordForEmail.mock.calls[0] as unknown as [string, { redirectTo: string }]
    expect(opcoes.redirectTo.endsWith('/redefinir-senha')).toBe(true)
    expect(await screen.findByText(/Se existir uma conta com esse e-mail/)).toBeInTheDocument()
  })

  it('IT-011 link de recuperação → formulário → nova senha → /conta com aviso', async () => {
    const { usuario, router } = renderComTudo({ rota: '/redefinir-senha#access_token=t&type=recovery' })
    await screen.findByLabelText('Nova senha')
    act(() => A.emitir('PASSWORD_RECOVERY', sessaoFake()))
    await usuario.type(screen.getByLabelText('Nova senha'), 'Senha123')
    await usuario.type(screen.getByLabelText('Confirmar nova senha'), 'Senha123')
    await usuario.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
    await waitFor(() => expect(A.updateUser).toHaveBeenCalledWith({ password: 'Senha123' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta'))
    expect(router.state.location.state).toEqual({ aviso: 'Senha alterada' })
  })
})
