import { describe, expect, it } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirMidia } from '../test/matchMedia'
import { erpFake, sessaoFake } from '../test/fakes'

const ROTULOS_SECOES = ['Produtos', 'Derivados', 'Categorias', 'Página inicial', 'Banners', 'Ofertas', 'Pagamento e frete', 'Dados da empresa', 'Aparência', 'Páginas de texto']

async function abrirAdmin(opcoes: { mobile?: boolean; papel?: string | null } = {}) {
  const { mobile = true, papel = 'dono' } = opcoes
  const r = renderComTudo(
    { rota: '/admin' },
    { mobile, sessaoErp: papel ? sessaoFake({ papel }) : null },
  )
  if (papel === 'dono') await screen.findByRole('heading', { name: 'Administração da loja' })
  return r
}

/** Abre a gaveta do celular e devolve o diálogo do menu. */
async function abrirGaveta(usuario: ReturnType<typeof renderComTudo>['usuario']) {
  await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
  return screen.findByRole('dialog', { name: 'Menu da administração' })
}

/** Textos dos botões e links do menu, na ordem do DOM (ordem de tabulação). */
function ordemDoMenu(menu: HTMLElement) {
  return [...menu.querySelectorAll<HTMLElement>('button, a')].map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim())
}

describe('AdminLayout e AdminMenu', () => {
  it('UT-339 celular: barra superior com botão de menu e "Administração"; sem faixa de abas', async () => {
    const { container } = await abrirAdmin({ mobile: true })
    const topo = container.querySelector('header.admin-topo') as HTMLElement
    expect(topo).not.toBeNull()
    expect(within(topo).getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument()
    expect(within(topo).getByText('Administração')).toBeInTheDocument()
    expect(container.querySelector('.filtros')).toBeNull()
  })

  it('UT-340 gaveta com as nove seções em ordem (a atual com aria-current), Tema, Voltar à loja e Sair', async () => {
    const { usuario, container } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    const nav = within(dialogo).getByRole('navigation', { name: 'Administração' })

    const secoes = within(nav).getAllByRole('button').filter((b) => ROTULOS_SECOES.includes(b.textContent ?? ''))
    expect(secoes.map((b) => b.textContent)).toEqual(ROTULOS_SECOES)
    expect(secoes[0]).toHaveAttribute('aria-current', 'page')
    expect(secoes.slice(1).every((b) => !b.hasAttribute('aria-current'))).toBe(true)

    expect(within(nav).getByText('Tema')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Voltar à loja' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(container.querySelector('.admin-menu')).not.toBeNull()
  })

  it('UT-341 escolher "Categorias" fecha a gaveta e mostra a seção', async () => {
    const { usuario } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Categorias' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu da administração' })).toBeNull())
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument()
    expect(document.querySelector('.admin-conteudo')).not.toBeNull()
    await waitFor(() => expect(erpFake.from).toHaveBeenCalled())
  })

  it('UT-342 "Voltar à loja" leva para /', async () => {
    const { usuario, router } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    await usuario.click(within(dialogo).getByRole('link', { name: 'Voltar à loja' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('UT-343 "Sair" chama erp.auth.signOut e mostra o login do admin', async () => {
    const { usuario } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(erpFake.auth.signOut).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()) // sai após a animação
    expect(screen.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
  })

  it('UT-344 sem sessão do ERP: tela de login, sem botão de menu nem navegação do admin', async () => {
    const { container } = await abrirAdmin({ mobile: true, papel: null })
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
    expect(container.querySelector('.admin-menu')).toBeNull()
    expect(container.querySelector('header.admin-topo')).toBeNull()
  })

  it('UT-345 papel "cliente": "Sem permissão" e nenhum menu', async () => {
    const { container } = await abrirAdmin({ mobile: true, papel: 'cliente' })
    expect(await screen.findByRole('heading', { name: 'Sem permissão' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
    expect(container.querySelector('.admin-menu')).toBeNull()
  })

  it('UT-346 computador: nav.admin-menu fixa sempre visível, sem botão de menu; clicar troca a seção', async () => {
    const { container, usuario } = await abrirAdmin({ mobile: false })
    const nav = container.querySelector('nav.admin-menu') as HTMLElement
    expect(nav).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()

    await usuario.click(within(nav).getByRole('button', { name: 'Aparência' }))
    expect(within(nav).getByRole('button', { name: 'Aparência' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByRole('heading', { name: 'Cor principal' })).toBeInTheDocument()
  })

  it('UT-347 o item Tema traz o ThemeToggle', async () => {
    const { usuario } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    const linha = within(dialogo).getByText('Tema').parentElement as HTMLElement
    expect(within(linha).getByRole('button', { name: /Ativar tema/ })).toBeInTheDocument()
  })

  it('UT-396 ordem de tabulação: as nove seções na ordem, depois Tema, Voltar à loja e Sair', async () => {
    const { usuario } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    const nav = within(dialogo).getByRole('navigation', { name: 'Administração' })
    const ordem = ordemDoMenu(nav)
    expect(ordem.slice(0, 10)).toEqual(ROTULOS_SECOES)
    expect(ordem[10]).toMatch(/Ativar tema/)
    expect(ordem.slice(11)).toEqual(['Voltar à loja', 'Sair'])
  })

  it('IT-024 gaveta → seção → computador (menu fixo) → celular (botão de volta)', async () => {
    const { usuario, container } = await abrirAdmin({ mobile: true })
    const dialogo = await abrirGaveta(usuario)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Aparência' }))
    expect(await screen.findByRole('heading', { name: 'Cor principal' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()) // sai após a animação

    // Gaveta aberta ao virar para o computador: some, e o menu fixo aparece com Aparência atual
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await screen.findByRole('dialog', { name: 'Menu da administração' })
    act(() => definirMidia({ mobile: false }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const nav = container.querySelector('nav.admin-menu') as HTMLElement
    expect(within(nav).getByRole('button', { name: 'Aparência' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Abrir menu' })).toBeNull()

    // Voltar ao celular: sem gaveta aberta herdada, com o botão de menu de novo
    act(() => definirMidia({ mobile: true }))
    expect(await screen.findByRole('button', { name: 'Abrir menu' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()) // sai após a animação
  })
})
