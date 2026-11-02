import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { logada } from '../test/dados'
import { instalarTabelas, supabaseFake } from '../test/fakes'

const tabelas = () => instalarTabelas((c) => ({ data: c.tabela === 'enderecos' ? [] : { nome: 'Ana Souza', telefone: '33999990000' }, error: null }))
const menu = () => document.querySelector('nav.conta-menu')

describe('ContaLayout', () => {
  it('UT-320 computador: menu lateral com as seis opções e a atual marcada', async () => {
    tabelas()
    renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada(), mobile: false })
    await screen.findByRole('heading', { name: 'Endereços' })
    const itens = within(menu() as HTMLElement).getAllByRole('listitem').map((li) => li.textContent)
    expect(itens).toEqual(['Meus pedidos', 'Meus dados', 'Endereços', 'Segurança', 'Privacidade', 'Sair'])
    expect(within(menu() as HTMLElement).getByRole('link', { name: 'Endereços' })).toHaveAttribute('aria-current', 'page')
    expect(within(menu() as HTMLElement).getByRole('link', { name: 'Meus dados' })).not.toHaveAttribute('aria-current')
  })

  it('UT-321 celular: sem menu lateral, só a tela', async () => {
    tabelas()
    renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await screen.findByRole('heading', { name: 'Endereços' })
    expect(menu()).toBeNull()
  })

  it('UT-322 computador sem login: convite no lugar, sem menu', async () => {
    renderComTudo({ rota: '/conta/dados' }, { mobile: false })
    expect(await screen.findByRole('heading', { name: 'Entre para acessar sua conta' })).toBeInTheDocument()
    expect(menu()).toBeNull()
  })

  it('Pedidos sem login usa o texto de pedidos e volta para a própria tela', async () => {
    renderComTudo({ rota: '/pedidos/12' })
    expect(await screen.findByRole('heading', { name: 'Entre para ver seus pedidos' })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fpedidos%2F12')
  })

  it('UT-323 Sair no menu encerra a sessão e abre o início', async () => {
    tabelas()
    const { usuario, router } = renderComTudo({ rota: '/conta/dados' }, { sessao: logada(), mobile: false })
    await usuario.click(await within(await screen.findByRole('navigation', { name: 'Minha conta' })).findByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(supabaseFake.auth.signOut).toHaveBeenCalled()
  })
})
