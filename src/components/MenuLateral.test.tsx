import { describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { afterEach } from 'vitest'
import { renderComTudo } from '../test/render'
import { definirRpc, erpFake, falharRpc, sessaoFake, supabaseFake } from '../test/fakes'
import { CATEGORIAS, logada, semearCatalogo, semearConfig } from '../test/dados'
import { linkWhatsApp } from '../config'

/** Faz a página parecer rolada: a rolagem salva pelo roteador deve voltar intacta ao fechar o menu. */
function rolarPara(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
}

async function abrir(rota = '/produtos', opcoes: Parameters<typeof renderComTudo>[1] = {}) {
  const r = renderComTudo({ rota }, opcoes)
  const botao = screen.queryByRole('button', { name: 'Abrir menu' })
  if (botao) await r.usuario.click(botao)
  // Subpáginas não têm botão de menu: abre pelo mesmo estado de histórico
  else await act(() => r.router.navigate(rota, { state: { menu: true }, preventScrollReset: true }))
  const menu = await screen.findByRole('dialog', { name: 'Menu' })
  return { ...r, menu: within(menu), painel: menu }
}

afterEach(() => void Reflect.deleteProperty(window, 'scrollY'))

describe('MenuLateral', () => {
  it('UT-135 abrir empilha a mesma tela com state.menu; abrir de novo não empilha; fechar volta uma entrada', async () => {
    semearCatalogo()
    rolarPara(300)
    const { router } = await abrir('/')
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.state).toEqual({ menu: true })
    vi.mocked(window.scrollTo).mockClear()
    await act(() => router.navigate(-1))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(router.state.location.state).toBeNull()
    expect(window.scrollTo).not.toHaveBeenCalledWith(0, 0)
  })

  it('abrir o menu numa raiz que não é o início mantém a URL (com a busca)', async () => {
    const { router } = await abrir('/buscar?q=ba')
    expect(router.state.location.pathname + router.state.location.search).toBe('/buscar?q=ba')
    expect(router.state.location.state).toEqual({ menu: true })
  })

  it('UT-136 com login: avatar, nome e e-mail levando para /conta', async () => {
    const { menu } = await abrir('/', { sessao: logada() })
    const conta = await menu.findByRole('link', { name: /Ana Souza/ })
    expect(conta).toHaveAttribute('href', '/conta')
    expect(conta.querySelector('.avatar-m')).not.toBeNull()
    expect(conta).toHaveTextContent('ana@exemplo.com')
  })

  it('UT-137 sem login: Entrar e Criar conta voltando para a tela atual', async () => {
    const { menu } = await abrir('/produtos')
    expect(await menu.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fprodutos')
    expect(menu.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro?voltar=%2Fprodutos')
  })

  it('UT-138 categorias: Todos + cada uma', async () => {
    semearCatalogo()
    const { menu } = await abrir()
    await menu.findByRole('link', { name: 'A' })
    expect(menu.getByRole('link', { name: 'Todos' })).toHaveAttribute('href', '/produtos')
    expect(menu.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/produtos?categoria=a')
    expect(menu.getByRole('link', { name: 'B' })).toHaveAttribute('href', '/produtos?categoria=b')
  })

  it('UT-139 catálogo carregando → espaço de espera em Categorias', async () => {
    erpFake.rpc.mockImplementation(() => new Promise(() => {}))
    const { painel } = await abrir()
    expect(painel.querySelector('.drawer-espera')).not.toBeNull()
  })

  it('UT-140 catálogo com erro → aviso, demais seções seguem', async () => {
    falharRpc('loja_catalogo_v2')
    const { menu } = await abrir()
    expect(await menu.findByText(/Não foi possível carregar as categorias/)).toBeInTheDocument()
    expect(menu.getByRole('heading', { name: 'Loja' })).toBeInTheDocument()
  })

  it('UT-141 sem categorias → sem o título Categorias', async () => {
    definirRpc('loja_catalogo_v2', [])
    const { menu } = await abrir()
    await waitFor(() => expect(screen.getByRole('dialog').querySelector('.drawer-espera')).toBeNull())
    expect(menu.queryByRole('heading', { name: 'Categorias' })).toBeNull()
  })

  it('UT-142 Loja: páginas do rodapé na ordem e depois Atendimento', async () => {
    definirRpc('loja_paginas', [
      { slug: 'x', titulo: 'Escondida', conteudo: '', no_rodape: false, ordem: 1 },
      { slug: 'sobre', titulo: 'Sobre', conteudo: '', no_rodape: true, ordem: 2 },
    ])
    const { painel } = await abrir()
    await within(painel).findByRole('link', { name: 'Sobre' })
    const loja = within(within(painel).getByRole('heading', { name: 'Loja' }).closest('section')!)
    expect(loja.getAllByRole('link').map((a) => a.textContent)).toEqual(['Sobre', 'Atendimento'])
  })

  it('UT-143 sem páginas no rodapé → só Atendimento', async () => {
    definirRpc('loja_paginas', [])
    const { painel } = await abrir()
    const loja = within(within(painel).getByRole('heading', { name: 'Loja' }).closest('section')!)
    expect(loja.getAllByRole('link').map((a) => a.textContent)).toEqual(['Atendimento'])
  })

  it('UT-144 horário e link do WhatsApp', async () => {
    semearConfig({ horario: 'Seg a sex, 8h-18h' })
    const { menu } = await abrir()
    expect(await menu.findByText('Seg a sex, 8h-18h')).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute('href', linkWhatsApp())
  })

  it('UT-145 sem número → horário sem link', async () => {
    semearConfig({ whatsapp: '' })
    const { menu } = await abrir()
    expect(await menu.findByText('Seg a sex, 8h-18h')).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Falar no WhatsApp' })).toBeNull()
  })

  it('UT-146 tema em Preferências', async () => {
    const { menu } = await abrir()
    const secao = menu.getByRole('heading', { name: 'Preferências' }).closest('section')!
    expect(within(secao).getByRole('button', { name: /Ativar tema/ })).toBeInTheDocument()
  })

  it('UT-147 Administração só para o papel certo', async () => {
    erpFake.auth.sessao = sessaoFake({ papel: 'dono' })
    const com = await abrir('/', { sessaoErp: sessaoFake({ papel: 'dono' }) })
    expect(await com.menu.findByRole('link', { name: 'Administração' })).toHaveAttribute('href', '/admin')
    com.unmount()
    const sem = await abrir('/', { sessaoErp: sessaoFake({ papel: 'cliente' }) })
    await waitFor(() => expect(erpFake.auth.getSession).toHaveBeenCalled())
    expect(sem.menu.queryByRole('link', { name: 'Administração' })).toBeNull()
  })

  it('UT-148 Sair: encerra a sessão e volta ao início', async () => {
    const { menu, router, usuario } = await abrir('/produtos', { sessao: logada() })
    await usuario.click(await menu.findByRole('button', { name: 'Sair' }))
    expect(supabaseFake.auth.signOut).toHaveBeenCalled()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('UT-149 links do menu trocam a entrada (o histórico não cresce)', async () => {
    semearCatalogo()
    const { router, menu, usuario } = await abrir('/')
    await usuario.click(await menu.findByRole('link', { name: 'B' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/produtos?categoria=b')
    expect(router.state.location.state).toBeNull()
    // abrir o menu empilhou 1 e o link trocou essa entrada: voltar cai direto no início
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/')
  })

  it('UT-377 navegar com o menu aberto → menu fechado', async () => {
    const { router } = await abrir('/')
    await act(() => router.navigate('/produtos'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()) // sai após a animação
  })

  it('UT-378 35 categorias → 36 links em Categorias', async () => {
    semearCatalogo(Array.from({ length: 35 }, (_, i) => ({ slug: `c${i}`, nome: `Cat ${i}` })))
    const { painel } = await abrir()
    await within(painel).findByRole('link', { name: 'Cat 34' })
    const secao = within(within(painel).getByRole('heading', { name: 'Categorias' }).closest('section')!)
    expect(secao.getAllByRole('link')).toHaveLength(36)
  })

  it('UT-379 sessão que cai com o menu aberto → Entrar e Criar conta', async () => {
    const { menu } = await abrir('/', { sessao: logada() })
    await menu.findByRole('link', { name: /Ana Souza/ })
    await act(async () => supabaseFake.auth.emitir('SIGNED_OUT', null))
    expect(await menu.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('IT-005 abrir pelo botão, voltar fecha sem mexer na rolagem; link do menu não deixa entrada para trás', async () => {
    semearCatalogo()
    rolarPara(300)
    const { router, usuario } = renderComTudo({ rota: '/' }, { historico: ['/produtos', '/'] })
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(router.state.location.state).toEqual({ menu: true })
    expect(router.state.location.pathname).toBe('/')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    vi.mocked(window.scrollTo).mockClear()
    await act(() => router.navigate(-1))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()) // sai após a animação
    expect(window.scrollTo).not.toHaveBeenCalledWith(0, 0)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 300)
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await usuario.click(await within(await screen.findByRole('dialog')).findByRole('link', { name: 'A' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/produtos?categoria=a')
    expect(router.state.location.state ?? null).toBeNull()
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/')
  })

  it('IT-019 Administração pelo papel do ERP e abre /admin', async () => {
    const { menu, usuario, router } = await abrir('/', { sessaoErp: sessaoFake({ papel: 'dono' }) })
    await usuario.click(await menu.findByRole('link', { name: 'Administração' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
  })

  it('IT-022 tema dentro do menu: troca o tema e o menu continua aberto', async () => {
    const { menu, usuario } = await abrir('/')
    const antes = document.documentElement.dataset.theme
    await usuario.click(menu.getByRole('button', { name: /Ativar tema/ }))
    expect(document.documentElement.dataset.theme).not.toBe(antes)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
