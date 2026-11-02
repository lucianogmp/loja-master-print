import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { logada } from '../test/dados'
import { supabaseFake } from '../test/fakes'

const A = supabaseFake.auth

async function preencher(usuario: ReturnType<typeof renderComTudo>['usuario'], email = 'a@b.c', senha = 'x') {
  await usuario.type(await screen.findByLabelText('E-mail'), email)
  if (senha) await usuario.type(document.getElementById('senha') as HTMLElement, senha)
}
const entrar = (u: ReturnType<typeof renderComTudo>['usuario']) => u.click(screen.getByRole('button', { name: 'Entrar' }))

describe('Entrar', () => {
  afterEach(() => vi.useRealTimers())

  it('UT-199 campos, links e sem Google', async () => {
    const { container } = renderComTudo({ rota: '/entrar' })
    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    expect(container.querySelector('.campo-senha')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.queryByText(/google/i)).toBeNull()
  })

  it('UT-200 e-mail inválido', async () => {
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario, 'abc')
    await entrar(usuario)
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(A.signInWithPassword).not.toHaveBeenCalled()
  })

  it('UT-201 senha vazia', async () => {
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario, 'a@b.c', '')
    await entrar(usuario)
    expect(await screen.findByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('UT-202 sucesso → volta para ?voltar= sem empilhar histórico', async () => {
    const { usuario, router } = renderComTudo({ rota: '/entrar?voltar=%2Fprodutos' }, { historico: ['/produtos', '/entrar?voltar=%2Fprodutos'] })
    const antes = router.state.historyAction
    expect(antes).toBeDefined()
    await preencher(usuario, ' a@b.c ')
    await entrar(usuario)
    await waitFor(() => expect(router.state.location.pathname).toBe('/produtos'))
    expect(A.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'x' })
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('UT-203 credenciais erradas → mensagem, senha limpa e com foco', async () => {
    A.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Invalid login credentials' } })
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
    const senha = document.getElementById('senha') as HTMLInputElement
    expect(senha).toHaveValue('')
    expect(senha).toHaveFocus()
  })

  it('UT-204 e-mail não confirmado → mensagem e Reenviar e-mail', async () => {
    A.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Email not confirmed' } })
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    expect(await screen.findByText(/Confirme seu e-mail antes de entrar/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeInTheDocument()
  })

  it('UT-205 reenviar → chama, desabilita com contagem e reabilita aos 60 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    A.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Email not confirmed' } })
    const { usuario } = renderComTudo({ rota: '/entrar?voltar=%2Fcheckout' })
    await preencher(usuario)
    await entrar(usuario)
    await usuario.click(await screen.findByRole('button', { name: 'Reenviar e-mail' }))
    expect(A.resend).toHaveBeenCalledWith({ type: 'signup', email: 'a@b.c', options: { emailRedirectTo: `${window.location.origin}/checkout` } })
    const botao = screen.getByRole('button', { name: /Reenviar e-mail/ })
    expect(botao).toBeDisabled()
    expect(botao.textContent).toContain('60')
    act(() => void vi.advanceTimersByTime(61_000))
    expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeEnabled()
  })

  it('UT-205b falha no reenvio → mensagem e botão liberado (sem cooldown)', async () => {
    A.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Email not confirmed' } })
    A.resend.mockResolvedValueOnce({ data: null, error: { message: 'falhou' } })
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    await usuario.click(await screen.findByRole('button', { name: 'Reenviar e-mail' }))
    expect(await screen.findByText('Não foi possível reenviar. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeEnabled()
  })

  it('UT-205c exceção de rede no reenvio → Sem conexão, sem cooldown', async () => {
    A.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Email not confirmed' } })
    A.resend.mockRejectedValueOnce(new Error('network'))
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    await usuario.click(await screen.findByRole('button', { name: 'Reenviar e-mail' }))
    expect(await screen.findByText('Sem conexão. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeEnabled()
  })

  it('UT-206 falha de rede → Sem conexão, campos mantidos', async () => {
    A.signInWithPassword.mockRejectedValueOnce(new Error('network'))
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    expect(await screen.findByText('Sem conexão. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@b.c')
    expect(document.getElementById('senha')).toHaveValue('x')
  })

  it('UT-207 duplo envio → uma chamada', async () => {
    let liberar: (v: unknown) => void = () => {}
    A.signInWithPassword.mockImplementationOnce(() => new Promise((r) => (liberar = r)) as never)
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
    await usuario.click(screen.getByRole('button', { name: 'Entrando...' }))
    expect(A.signInWithPassword).toHaveBeenCalledTimes(1)
    await act(async () => liberar({ data: {}, error: null }))
  })

  it('UT-208 limite de tentativas', async () => {
    A.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'email rate limit exceeded' } })
    const { usuario } = renderComTudo({ rota: '/entrar' })
    await preencher(usuario)
    await entrar(usuario)
    expect(await screen.findByText('Muitas tentativas. Aguarde um pouco e tente de novo.')).toBeInTheDocument()
  })

  it('UT-209 já logada → vai direto para voltar', async () => {
    const { router } = renderComTudo({ rota: '/entrar?voltar=%2Fcheckout' }, { sessao: logada() })
    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
    expect(screen.queryByLabelText('E-mail')).toBeNull()
  })

  it('UT-210 link Esqueci minha senha leva voltar e e-mail', async () => {
    const { usuario } = renderComTudo({ rota: '/entrar?voltar=%2Fcheckout' })
    await preencher(usuario, 'a@b.c', '')
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/esqueci-senha?voltar=%2Fcheckout&email=a%40b.c')
  })

  it('UT-211 aviso de link expirado', async () => {
    renderComTudo({ rota: '/entrar?aviso=link-expirado' })
    expect(await screen.findByText('Link inválido ou expirado. Entre ou peça um novo link.')).toBeInTheDocument()
  })

  it('UT-380 SIGNED_IN em outra aba → vai para voltar', async () => {
    const { router } = renderComTudo({ rota: '/entrar?voltar=%2Fcheckout' })
    await screen.findByLabelText('E-mail')
    act(() => A.emitir('SIGNED_IN', logada()))
    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
  })
})
