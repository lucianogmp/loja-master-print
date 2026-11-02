import { describe, expect, it } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'

const transicao = () => document.documentElement.dataset.transicao

describe('Raiz', () => {
  it('UT-156 sentido da transição: subpágina empurra, voltar recua, entre raízes não anima', async () => {
    const { router } = renderComTudo({ rota: '/' }, { mobile: true })
    await act(() => router.navigate('/produto/a'))
    expect(transicao()).toBe('push')
    await act(() => router.navigate(-1))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(transicao()).toBe('pop')
    await act(() => router.navigate('/buscar'))
    expect(transicao()).toBe('nenhuma')
  })

  it('UT-157 estado antigo do menu é limpo ao abrir', async () => {
    const { router } = renderComTudo({ rota: '/' }, { historico: [{ pathname: '/', state: { menu: true } }] })
    await waitFor(() => expect(router.state.location.state).toBeNull())
    expect(router.state.location.pathname).toBe('/')
  })

  it('UT-158 erro de link do e-mail no hash → /entrar?aviso=link-expirado', async () => {
    const { router } = renderComTudo({ rota: '/qualquer#error=access_denied&error_code=otp_expired' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.search).toBe('?aviso=link-expirado')
    expect(router.state.location.hash).toBe('')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
