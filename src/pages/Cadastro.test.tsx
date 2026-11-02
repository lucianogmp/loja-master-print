import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { supabaseFake } from '../test/fakes'
import { senhaVazada } from '../lib/senha'

vi.mock('../lib/senha', async (orig) => ({ ...(await orig<typeof import('../lib/senha')>()), senhaVazada: vi.fn(async () => false) }))

const A = supabaseFake.auth
type U = ReturnType<typeof renderComTudo>['usuario']

async function preencher(u: U, o: { nome?: string; tel?: string; email?: string; senha?: string; aceite?: boolean } = {}) {
  const { nome = 'Ana Souza', tel = '11999999999', email = 'a@b.c', senha = 'Senha123', aceite = true } = o
  if (nome) await u.type(await screen.findByLabelText('Nome'), nome)
  if (tel) await u.type(screen.getByLabelText('WhatsApp'), tel)
  if (email) await u.type(screen.getByLabelText('E-mail'), email)
  if (senha) await u.type(document.getElementById('senha') as HTMLElement, senha)
  if (aceite) await u.click(screen.getByRole('checkbox'))
}
const criar = (u: U) => u.click(screen.getByRole('button', { name: 'Criar conta' }))

describe('Cadastro', () => {
  it('UT-212 campos, dica e sem Google', async () => {
    const { container } = renderComTudo({ rota: '/cadastro' })
    expect(await screen.findByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(container.querySelector('.campo-senha')).not.toBeNull()
    expect(screen.getByText('Mínimo de 8 caracteres, com letras e números')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Já tenho conta' })).toBeInTheDocument()
    expect(screen.queryByText(/google/i)).toBeNull()
  })

  it('UT-213 senha fraca vem antes do WhatsApp', async () => {
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario, { senha: 'abc', tel: '119999' })
    await criar(usuario)
    expect(await screen.findByText('A senha precisa ter 8 caracteres, com letras e números.')).toBeInTheDocument()
    expect(screen.queryByText('Informe um WhatsApp válido com DDD.')).toBeNull()
    expect(A.signUp).not.toHaveBeenCalled()
  })

  it('UT-214 WhatsApp curto', async () => {
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario, { tel: '119999' })
    await criar(usuario)
    expect(await screen.findByText('Informe um WhatsApp válido com DDD.')).toBeInTheDocument()
  })

  it('UT-215 sem aceite', async () => {
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario, { aceite: false })
    await criar(usuario)
    expect(await screen.findByText('Aceite a Política de Privacidade para continuar.')).toBeInTheDocument()
  })

  it('UT-216 senha vazada', async () => {
    vi.mocked(senhaVazada).mockResolvedValueOnce(true)
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario)
    await criar(usuario)
    expect(await screen.findByText('Essa senha apareceu em vazamentos. Escolha outra.')).toBeInTheDocument()
    expect(A.signUp).not.toHaveBeenCalled()
  })

  it('UT-217 envia dados limpos e vai para Confirme com o e-mail', async () => {
    const { usuario, router } = renderComTudo({ rota: '/cadastro?voltar=%2Fcheckout' })
    await preencher(usuario, { nome: '  Ana   Souza ', tel: '(11) 99999-9999' })
    await criar(usuario)
    await waitFor(() => expect(router.state.location.pathname).toBe('/confirme-email'))
    expect(A.signUp).toHaveBeenCalledWith({
      email: 'a@b.c',
      password: 'Senha123',
      options: { data: { nome: 'Ana Souza', telefone: '11999999999' }, emailRedirectTo: `${window.location.origin}/checkout` },
    })
    expect(router.state.location.search).toBe('?voltar=%2Fcheckout')
    expect(router.state.location.state).toEqual({ email: 'a@b.c' })
  })

  it('UT-218 e-mail já cadastrado → mesma tela de sucesso', async () => {
    A.signUp.mockResolvedValueOnce({ data: null, error: { message: 'User already registered' } })
    const { usuario, router } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario)
    await criar(usuario)
    await waitFor(() => expect(router.state.location.pathname).toBe('/confirme-email'))
  })

  it('UT-219 serviço de vazamento fora do ar → cadastro segue (falha aberta)', async () => {
    const { senhaVazada: real } = await vi.importActual<typeof import('../lib/senha')>('../lib/senha')
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('fora'))))
    expect(await real('Senha123')).toBe(false)
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario)
    await criar(usuario)
    await waitFor(() => expect(A.signUp).toHaveBeenCalled())
  })

  it('UT-220 DDI 55 é removido', async () => {
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario, { tel: '+55 (11) 9 9999-9999' })
    await criar(usuario)
    await waitFor(() => expect(A.signUp).toHaveBeenCalled())
    expect((A.signUp.mock.calls[0] as unknown[])[0]).toMatchObject({ options: { data: { telefone: '11999999999' } } })
  })

  it('UT-221 duplo envio → um signUp', async () => {
    let liberar: (v: unknown) => void = () => {}
    A.signUp.mockImplementationOnce(() => new Promise((r) => (liberar = r)) as never)
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario)
    await criar(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Criando...' }))
    expect(A.signUp).toHaveBeenCalledTimes(1)
    liberar({ data: {}, error: null })
  })

  it('UT-222 falha de rede → Sem conexão, valores mantidos', async () => {
    A.signUp.mockRejectedValueOnce(new Error('rede'))
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario)
    await criar(usuario)
    expect(await screen.findByText('Sem conexão. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Ana Souza')
  })

  it('UT-223 nome e e-mail inválidos → erros antes de qualquer chamada', async () => {
    const { usuario } = renderComTudo({ rota: '/cadastro' })
    await preencher(usuario, { nome: 'A', email: 'x' })
    await criar(usuario)
    expect(await screen.findByText('Informe seu nome (2 a 80 letras).')).toBeInTheDocument()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(A.signUp).not.toHaveBeenCalled()
  })
})
