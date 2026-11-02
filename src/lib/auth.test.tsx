import { describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { logada } from '../test/dados'
import { supabaseFake } from '../test/fakes'
import { reenviarConfirmacao, useAuth } from './auth'

function Sonda() {
  const a = useAuth()
  return (
    <div>
      <p data-testid="estado">{`rec=${a.recuperacao} exp=${a.expirou} sessao=${a.session ? 'sim' : 'nao'}`}</p>
      <button onClick={() => void a.sair()}>sair</button>
      <button onClick={() => void a.marcarSessaoExpirada()}>expirar</button>
    </div>
  )
}
const estado = () => screen.getByTestId('estado').textContent

describe('auth.tsx', () => {
  it('UT-353 PASSWORD_RECOVERY liga recuperacao', async () => {
    renderComTudo(<Sonda />)
    await screen.findByTestId('estado')
    act(() => supabaseFake.auth.emitir('PASSWORD_RECOVERY', logada()))
    expect(estado()).toContain('rec=true')
  })

  it('UT-354 sair() remove as chaves loja-pedidos:*', async () => {
    localStorage.setItem('loja-pedidos:u1', '{}')
    localStorage.setItem('loja-pedidos:u2', '{}')
    localStorage.setItem('outra', '1')
    const { usuario } = renderComTudo(<Sonda />, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'sair' }))
    expect(supabaseFake.auth.signOut).toHaveBeenCalled()
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(localStorage.getItem('loja-pedidos:u2')).toBeNull()
    expect(localStorage.getItem('outra')).toBe('1')
  })

  it('UT-355 marcarSessaoExpirada → signOut local, expirou, sem sessão', async () => {
    const { usuario } = renderComTudo(<Sonda />, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'expirar' }))
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(estado()).toContain('exp=true')
    expect(estado()).toContain('sessao=nao')
  })

  it('UT-356 SIGNED_IN depois de expirar zera expirou', async () => {
    const { usuario } = renderComTudo(<Sonda />, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'expirar' }))
    act(() => supabaseFake.auth.emitir('SIGNED_IN', logada()))
    expect(estado()).toContain('exp=false')
  })

  it('UT-357 reenviarConfirmacao chama auth.resend', async () => {
    await reenviarConfirmacao('a@b.c', '/checkout')
    expect(supabaseFake.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'a@b.c',
      options: { emailRedirectTo: `${window.location.origin}/checkout` },
    })
  })
})
