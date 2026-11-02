import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirRpc } from '../test/fakes'

const PRIVACIDADE = { slug: 'privacidade', titulo: 'Privacidade', conteudo: 'Texto', no_rodape: true, ordem: 0 }

describe('AuthLayout', () => {
  it('UT-192 /entrar sem a casca da loja', async () => {
    const { container } = renderComTudo({ rota: '/entrar' })
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(container.querySelector('header.header')).toBeNull()
    expect(container.querySelector('footer.footer')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull()
    expect(container.querySelector('.whatsapp-flutuante')).toBeNull()
  })

  it('UT-193 Voltar leva ao ?voltar=', async () => {
    const { usuario, router } = renderComTudo({ rota: '/entrar?voltar=%2Fcheckout' })
    await usuario.click(await screen.findByRole('button', { name: 'Voltar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
  })

  it('UT-194 sem ?voltar=, volta para a entrada anterior da loja', async () => {
    const { usuario, router } = renderComTudo({ rota: '/entrar' }, { historico: ['/produtos', '/entrar'] })
    await usuario.click(await screen.findByRole('button', { name: 'Voltar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/produtos'))
  })

  it('UT-195 sem ?voltar= e sem histórico → início', async () => {
    const { usuario, router } = renderComTudo({ rota: '/entrar' })
    await usuario.click(await screen.findByRole('button', { name: 'Voltar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('UT-196 página de privacidade existe → link no rodapé', async () => {
    definirRpc('loja_paginas', [PRIVACIDADE])
    renderComTudo({ rota: '/entrar' })
    const link = await screen.findByRole('link', { name: 'Política de Privacidade' })
    expect(link).toHaveAttribute('href', '/pagina/privacidade')
    expect(link.closest('footer')).toHaveClass('auth-rodape')
  })

  it('UT-197 sem a página → sem link no rodapé', async () => {
    definirRpc('loja_paginas', [])
    const { container } = renderComTudo({ rota: '/entrar' })
    await screen.findByRole('heading', { name: 'Entrar' })
    await waitFor(() => expect(container.querySelector('.auth-topo')).not.toBeNull())
    expect(container.querySelector('.auth-rodape')).toBeNull()
  })

  it('UT-198 sem logotipo → nome da loja no topo', async () => {
    const { container } = renderComTudo({ rota: '/entrar' })
    await screen.findByRole('heading', { name: 'Entrar' })
    const topo = container.querySelector('.auth-topo')!
    expect(topo).toHaveTextContent(/master print/i)
    expect(topo.querySelector('.marca-texto')).not.toBeNull()
  })
})
