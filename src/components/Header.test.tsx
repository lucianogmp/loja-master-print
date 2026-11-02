import { describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { renderComTudo } from '../test/render'
import { sessaoFake, supabaseFake } from '../test/fakes'

describe('Header (computador)', () => {
  it('UT-397 conta: espaço neutro carregando → avatar com login → Entrar sem login', async () => {
    // Sessão ainda carregando: getSession só resolve quando o teste mandar
    let resolver!: (s: Session | null) => void
    supabaseFake.auth.getSession.mockImplementationOnce(
      () => new Promise((r) => (resolver = (session) => r({ data: { session }, error: null }))),
    )
    const { container, unmount } = renderComTudo({ rota: '/produtos' }, { mobile: false })
    const acoes = container.querySelector('.header-acoes')!
    expect(acoes.querySelector('.avatar-espera')).not.toBeNull()
    expect(acoes).not.toHaveTextContent('Entrar')

    await act(async () => resolver(sessaoFake({ nome: 'Ana Souza' })))
    const conta = screen.getByRole('link', { name: 'Minha conta' })
    expect(conta).toHaveAttribute('href', '/conta')
    expect(conta.querySelector('.avatar-p')).toHaveTextContent('AS')
    expect(acoes.querySelector('.avatar-espera')).toBeNull()
    unmount()

    renderComTudo({ rota: '/produtos' }, { mobile: false })
    const entrar = await screen.findByRole('link', { name: 'Entrar' })
    expect(entrar).toHaveAttribute('href', '/entrar?voltar=%2Fprodutos')
  })
})
