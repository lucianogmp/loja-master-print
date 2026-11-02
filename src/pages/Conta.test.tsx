import { describe, expect, it } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { fetchErp, logada, pedidoFalso, respostaJson, semearPedidos } from '../test/dados'
import { instalarTabelas, sessaoFake, supabaseFake } from '../test/fakes'

const perfil = (nome: string | null = 'Ana Souza') =>
  instalarTabelas((c) => ({ data: c.tabela === 'perfis' ? { nome } : [], error: null }))

const hub = () => screen.getByRole('list')
const linhas = () => within(hub()).getAllByRole('listitem').map((li) => li.textContent)

describe('Conta (hub)', () => {
  it('UT-299 linhas na ordem do PRD, com Sair por último', async () => {
    perfil()
    // a dica de instalar tem teste próprio (UT-304); aqui só as linhas do PRD
    localStorage.setItem('loja-dica-instalar', JSON.stringify({ v: 1, dispensadaEm: new Date().toISOString() }))
    renderComTudo({ rota: '/conta' }, { sessao: logada() })
    await screen.findByText('Meus pedidos')
    expect(linhas()).toEqual(['Meus pedidos', 'Meus dados', 'Endereços', 'Segurança', 'Privacidade', 'Atendimento', 'Sair'])
  })

  it('UT-300 cabeçalho com avatar grande, nome e e-mail', async () => {
    perfil('Ana Souza')
    const { container } = renderComTudo({ rota: '/conta' }, { sessao: logada() })
    expect(await screen.findByText('Ana Souza')).toHaveClass('hub-nome')
    expect(container.querySelector('.hub-cabecalho .avatar-g')).not.toBeNull()
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument()
  })

  it('UT-301 sem nome: o e-mail é a linha principal', async () => {
    perfil(null)
    renderComTudo({ rota: '/conta' }, { sessao: sessaoFake({ email: 'sem@nome.com' }) })
    await waitFor(() => expect(document.querySelector('.hub-nome')).toHaveTextContent('sem@nome.com'))
  })

  it('UT-302 destinos das linhas', async () => {
    perfil()
    renderComTudo({ rota: '/conta' }, { sessao: logada() })
    await screen.findByText('Meus pedidos')
    const hrefs = within(hub()).getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/pedidos', '/conta/dados', '/conta/enderecos', '/conta/seguranca', '/conta/privacidade', '/atendimento'])
  })

  it('UT-303 Sair encerra a sessão e abre o início', async () => {
    perfil()
    const { usuario, router } = renderComTudo({ rota: '/conta' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(supabaseFake.auth.signOut).toHaveBeenCalled()
  })

  it('UT-394 Sair com o servidor recusando ainda limpa o cache e a sessão local', async () => {
    perfil()
    semearPedidos('u1', [pedidoFalso(1)])
    supabaseFake.auth.signOut.mockRejectedValueOnce(new Error('sem rede'))
    const { usuario, router } = renderComTudo({ rota: '/conta' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  it.each([
    ['pedidos', '/pedidos'],
    ['dados', '/conta/dados'],
    ['enderecos', '/conta/enderecos'],
    ['seguranca', '/conta/seguranca'],
    ['privacidade', '/conta/privacidade'],
  ])('UT-305/306 /conta?aba=%s → %s sem empilhar histórico', async (aba, destino) => {
    perfil()
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [] }) })
    const { router } = renderComTudo({ rota: `/conta?aba=${aba}` }, { sessao: logada() })
    await waitFor(() => expect(router.state.location.pathname).toBe(destino))
    expect(router.state.location.search).toBe('')
    expect(router.state.historyAction).toBe('REPLACE')
    // sem entrada extra: voltar não reabre a rota antiga
    expect(router.state.location.key).not.toBe('default')
  })

  it('UT-307 aba desconhecida abre o hub', async () => {
    perfil()
    const { router } = renderComTudo({ rota: '/conta?aba=xyz' }, { sessao: logada() })
    await screen.findByText('Meus pedidos')
    expect(router.state.location.pathname).toBe('/conta')
  })

  it('UT-308 computador: /conta abre Meus dados (replace)', async () => {
    perfil()
    const { router } = renderComTudo({ rota: '/conta' }, { sessao: logada(), mobile: false })
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/dados'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('computador: o aviso passageiro segue para Meus dados', async () => {
    perfil()
    const { router } = renderComTudo({ rota: '/conta' }, { sessao: logada(), mobile: false, historico: [{ pathname: '/conta', state: { aviso: 'Senha alterada' } }] })
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/dados'))
    expect(router.state.location.state).toEqual({ aviso: 'Senha alterada' })
    expect(await screen.findByText('Senha alterada')).toBeInTheDocument()
  })

  it('UT-309 perfil falhou: e-mail da sessão e aviso', async () => {
    instalarTabelas(() => ({ data: null, error: { message: 'x' } }))
    renderComTudo({ rota: '/conta' }, { sessao: logada() })
    expect(await screen.findByText('Não foi possível carregar seus dados.')).toBeInTheDocument()
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument()
  })

  it('UT-385 perfil carregando: esqueleto no cabeçalho e linhas já clicáveis', async () => {
    instalarTabelas(() => new Promise(() => {}))
    const { container, usuario, router } = renderComTudo({ rota: '/conta' }, { sessao: logada() })
    await screen.findByText('Meus dados')
    expect(container.querySelector('.hub-cabecalho .esqueleto-linha')).not.toBeNull()
    await usuario.click(screen.getByRole('link', { name: 'Meus dados' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/dados'))
  })
})

describe('Conta (integração)', () => {
  it('IT-016 aba antiga sem login: o convite já aponta para a tela nova; depois de entrar, ela abre', async () => {
    instalarTabelas(() => ({ data: [], error: null }))
    const { router } = renderComTudo({ rota: '/conta?aba=enderecos' })
    expect(await screen.findByRole('heading', { name: 'Entre para acessar sua conta' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/conta/enderecos')
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fconta%2Fenderecos')
    act(() => supabaseFake.auth.emitir('SIGNED_IN', logada()))
    expect(await screen.findByRole('button', { name: 'Adicionar endereço' })).toBeInTheDocument()
  })

  it('IT-017 computador: menu lateral troca de tela; celular: hub → subpágina → voltar', async () => {
    instalarTabelas(() => ({ data: [], error: null }))
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [] }) })
    const desk = renderComTudo({ rota: '/pedidos' }, { sessao: logada(), mobile: false })
    const menu = await screen.findByRole('navigation', { name: 'Minha conta' })
    await desk.usuario.click(within(menu).getByRole('link', { name: 'Endereços' }))
    await waitFor(() => expect(desk.router.state.location.pathname).toBe('/conta/enderecos'))
    expect(within(menu).getByRole('link', { name: 'Endereços' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByRole('heading', { name: 'Endereços' })).toBeInTheDocument()
    desk.unmount()

    const mob = renderComTudo({ rota: '/conta' }, { sessao: logada() })
    await mob.usuario.click(await screen.findByRole('link', { name: 'Meus dados' }))
    await waitFor(() => expect(mob.router.state.location.pathname).toBe('/conta/dados'))
    await mob.usuario.click(await screen.findByRole('button', { name: 'Voltar' }))
    await waitFor(() => expect(mob.router.state.location.pathname).toBe('/conta'))
  })

  it('IT-020 Sair no menu lateral: encerra, apaga o cache, abre o início e a barra mostra o ícone de entrar', async () => {
    instalarTabelas(() => ({ data: [], error: null }))
    semearPedidos('u1', [pedidoFalso(1)])
    fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>(() => {}) })
    const { usuario, router } = renderComTudo({ rota: '/pedidos' }, { sessao: logada() })
    await screen.findByText('Pedido nº 1')
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
    const gaveta = await screen.findByRole('dialog')
    await usuario.click(within(gaveta).getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(supabaseFake.auth.signOut).toHaveBeenCalled()
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    const barra = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(barra.querySelector('.avatar')).toBeNull()
  })

  it('IT-026 salvar o nome atualiza o avatar da barra sem recarregar', async () => {
    instalarTabelas((c) => ({ data: c.tabela === 'perfis' ? { nome: 'Ana Souza', telefone: '33999990000' } : [], error: null }))
    supabaseFake.auth.updateUser.mockImplementationOnce((async (dados: { data: { nome: string } }) => {
      supabaseFake.auth.emitir('USER_UPDATED', sessaoFake({ nome: dados.data.nome }))
      return { data: {}, error: null }
    }) as never)
    const { usuario } = renderComTudo({ rota: '/conta/dados' }, { sessao: logada() })
    const barra = screen.getByRole('navigation', { name: 'Navegação principal' })
    const avatar = await within(barra).findByRole('img', { name: 'Ana Souza' })
    expect(avatar).toHaveTextContent('AS')
    const nome = await screen.findByLabelText('Nome')
    await waitFor(() => expect(nome).toHaveValue('Ana Souza'))
    await usuario.clear(nome)
    await usuario.type(nome, 'Bia Lima')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Dados salvos.')
    const novo = within(barra).getByRole('img', { name: 'Bia Lima' })
    expect(novo).toHaveTextContent('BL')
    expect(novo.isConnected).toBe(true)
  })
})
