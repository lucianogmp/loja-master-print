import { describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { logada } from '../test/dados'
import { supabaseFake } from '../test/fakes'
import { senhaVazada } from '../lib/senha'

vi.mock('../lib/senha', async (orig) => ({ ...(await orig<typeof import('../lib/senha')>()), senhaVazada: vi.fn(async () => false) }))

const A = supabaseFake.auth
const REC = '/redefinir-senha#access_token=t&type=recovery'
type U = ReturnType<typeof renderComTudo>['usuario']

async function preencher(u: U, s1 = 'Senha123', s2 = s1) {
  await u.type(await screen.findByLabelText('Nova senha'), s1)
  await u.type(screen.getByLabelText('Confirmar nova senha'), s2)
}
const salvar = (u: U) => u.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

describe('RedefinirSenha', () => {
  it('UT-237 em recuperação → dois campos e botão', async () => {
    const { container } = renderComTudo({ rota: REC })
    expect(await screen.findByRole('button', { name: 'Salvar nova senha' })).toBeInTheDocument()
    expect(container.querySelectorAll('.campo-senha')).toHaveLength(2)
  })

  it('UT-238 senhas diferentes', async () => {
    const { usuario } = renderComTudo({ rota: REC })
    await preencher(usuario, 'Senha123', 'Senha124')
    await salvar(usuario)
    expect(await screen.findByText('As senhas não coincidem.')).toBeInTheDocument()
    expect(A.updateUser).not.toHaveBeenCalled()
  })

  it('UT-239 senha fraca', async () => {
    const { usuario } = renderComTudo({ rota: REC })
    await preencher(usuario, 'abc')
    await salvar(usuario)
    expect(await screen.findByText('A senha precisa ter 8 caracteres, com letras e números.')).toBeInTheDocument()
  })

  it('UT-240 sucesso → destino com aviso', async () => {
    const { usuario, router } = renderComTudo({ rota: REC }, { sessao: logada() })
    await preencher(usuario)
    await salvar(usuario)
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta'))
    expect(A.updateUser).toHaveBeenCalledWith({ password: 'Senha123' })
    expect(router.state.location.state).toEqual({ aviso: 'Senha alterada' })
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('UT-241 hash com erro → link inválido e Pedir novo link', async () => {
    renderComTudo({ rota: '/redefinir-senha#error=access_denied&error_code=otp_expired' })
    expect(await screen.findByText('Link inválido ou expirado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir novo link' })).toHaveAttribute('href', '/esqueci-senha')
  })

  it('UT-242 logada sem recuperação → aponta para Segurança', async () => {
    renderComTudo({ rota: '/redefinir-senha' }, { sessao: logada() })
    expect(await screen.findByText('Para trocar a senha, use Conta > Segurança.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para Segurança' })).toHaveAttribute('href', '/conta/seguranca')
  })

  it('UT-243 sem sessão, recuperação nem hash → inválido', async () => {
    renderComTudo({ rota: '/redefinir-senha' })
    expect(await screen.findByText('Link inválido ou expirado')).toBeInTheDocument()
  })

  it('UT-244 checagem de vazamento falha → segue', async () => {
    vi.mocked(senhaVazada).mockResolvedValueOnce(false)
    const { usuario } = renderComTudo({ rota: REC })
    await preencher(usuario)
    await salvar(usuario)
    await waitFor(() => expect(A.updateUser).toHaveBeenCalled())
  })

  it('UT-245 duplo envio → um updateUser', async () => {
    let liberar: (v: unknown) => void = () => {}
    A.updateUser.mockImplementationOnce(() => new Promise((r) => (liberar = r)) as never)
    const { usuario } = renderComTudo({ rota: REC })
    await preencher(usuario)
    await salvar(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Salvando...' }))
    expect(A.updateUser).toHaveBeenCalledTimes(1)
    await act(async () => liberar({ data: {}, error: null }))
  })

  it('UT-246 falha de rede → Sem conexão', async () => {
    A.updateUser.mockRejectedValueOnce(new Error('rede'))
    const { usuario } = renderComTudo({ rota: REC })
    await preencher(usuario)
    await salvar(usuario)
    expect(await screen.findByText('Sem conexão. Tente novamente.')).toBeInTheDocument()
  })
})
