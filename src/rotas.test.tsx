import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { RouteObject } from 'react-router-dom'
import { rotas } from './rotas'
import { handleAtual, type Handle } from './lib/telas'
import { logada } from './test/dados'
import { instalarTabelas } from './test/fakes'
import { renderComTudo } from './test/render'
import { sessaoFake } from './test/fakes'

function todas(lista: RouteObject[]): RouteObject[] {
  return lista.flatMap((r) => [r, ...todas(r.children ?? [])])
}

function semCasca(container: HTMLElement) {
  expect(container.querySelector('header.header')).toBeNull()
  expect(container.querySelector('footer.footer')).toBeNull()
  expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull()
  expect(container.querySelector('.whatsapp-flutuante')).toBeNull()
}

describe('rotas', () => {
  it('UT-328 checkout esconde a barra e tem título "Finalizar pedido"', () => {
    const checkout = todas(rotas).find((r) => r.path === 'checkout')
    expect(checkout?.handle).toMatchObject({ semBarra: true, titulo: 'Finalizar pedido' })
  })
})

describe('Rotas e layouts', () => {
  it.each([true, false])('IT-003 /entrar sem casca da loja ao abrir e depois de navegar (mobile=%s)', async (mobile) => {
    const direto = renderComTudo({ rota: '/entrar' }, { mobile })
    await screen.findByRole('heading', { name: 'Entrar' })
    semCasca(direto.container)
    direto.unmount()

    const { container, usuario, router } = renderComTudo({ rota: '/' }, { mobile })
    expect(container.querySelector('.whatsapp-flutuante')).not.toBeNull()
    await usuario.click(await screen.findByRole('link', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    await screen.findByRole('heading', { name: 'Entrar' })
    semCasca(container)
  })

  it('IT-004 /admin sem casca da loja', async () => {
    const { container } = renderComTudo({ rota: '/admin' }, { mobile: true, sessaoErp: sessaoFake({ papel: 'admin' }) })
    expect(await screen.findByRole('heading', { name: 'Administração da loja' })).toBeInTheDocument()
    semCasca(container)
  })
})

describe('Tabela de rotas', () => {
  // [caminho, o que a tela mostra, handle documentado no TechSpec]
  const TABELA: [string, string | RegExp, Handle | undefined][] = [
    ['/', /./, { nivel: 'raiz', aba: 'inicio', chips: true }],
    ['/buscar', /./, { nivel: 'raiz', aba: 'buscar' }],
    ['/produtos', /./, { nivel: 'sub', aba: 'buscar', titulo: 'Produtos', chips: true }],
    ['/produto/x', 'Produto não encontrado', { nivel: 'sub', aba: 'buscar', titulo: 'Produto', semWhatsApp: true }],
    ['/carrinho', 'Seu carrinho está vazio', { nivel: 'raiz', aba: 'carrinho' }],
    ['/checkout', 'Nada para finalizar', { nivel: 'sub', aba: 'carrinho', titulo: 'Finalizar pedido', semBarra: true }],
    ['/pedidos', 'Meus pedidos', { nivel: 'raiz', aba: 'pedidos' }],
    ['/pedidos/1', 'Não conseguimos carregar o pedido.', { nivel: 'sub', aba: 'pedidos', titulo: 'Pedido', semWhatsApp: true }],
    ['/conta', 'Meus dados', { nivel: 'raiz', aba: 'conta' }],
    ['/conta/dados', 'Nome', { nivel: 'sub', aba: 'conta', titulo: 'Meus dados', semWhatsApp: true }],
    ['/conta/enderecos', 'Você ainda não salvou endereços. Cadastre um para agilizar seus pedidos com entrega.', { nivel: 'sub', aba: 'conta', titulo: 'Endereços', semWhatsApp: true }],
    ['/conta/seguranca', 'Trocar senha', { nivel: 'sub', aba: 'conta', titulo: 'Segurança', semWhatsApp: true }],
    ['/conta/privacidade', 'Baixar meus dados', { nivel: 'sub', aba: 'conta', titulo: 'Privacidade' }],
    ['/atendimento', 'Como funciona', { nivel: 'sub', aba: 'conta', titulo: 'Atendimento', semWhatsApp: true }],
    ['/pagina/x', /Página não encontrada|Carregando/, { nivel: 'sub', titulo: 'Página' }],
    ['/entrar', 'Entrar', undefined],
    ['/cadastro', 'Criar conta', undefined],
    ['/esqueci-senha', 'Esqueci minha senha', undefined],
    ['/redefinir-senha', /Link inválido ou expirado|Nova senha|Redefinir senha/, undefined],
    ['/confirme-email', 'Confira seu e-mail', undefined],
    ['/admin', 'Administração da loja', undefined],
    ['/zzz', 'Não encontramos o que você procurava.', { nivel: 'sub', titulo: 'Página não encontrada' }],
  ]

  it.each(TABELA)('IT-001 %s abre a tela certa com o handle documentado', async (caminho, texto, handle) => {
    instalarTabelas((c) => ({ data: c.tabela === 'perfis' ? { nome: 'Ana Souza', telefone: '33999990000' } : [], error: null }))
    const { router, container } = renderComTudo({ rota: caminho }, { sessao: ['/entrar', '/cadastro', '/esqueci-senha', '/redefinir-senha', '/confirme-email'].includes(caminho) ? null : logada(), sessaoErp: sessaoFake({ papel: 'admin' }) })
    if (texto instanceof RegExp && texto.source === '.') await waitFor(() => expect(container.querySelector('main, .auth, header')).not.toBeNull())
    else await waitFor(() => expect(screen.getAllByText(texto).length).toBeGreaterThan(0))
    expect(handleAtual(router.state.matches.map((m) => ({ handle: m.route.handle })))).toEqual(handle)
    expect(router.state.location.pathname).toBe(caminho)
  })
})
