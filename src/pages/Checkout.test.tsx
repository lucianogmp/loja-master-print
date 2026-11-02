import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { chamadasPedidos, fetchErp, logada, pedidoFalso, respostaJson, semearCarrinho, semearCatalogo, semearPedidos } from '../test/dados'
import { instalarTabelas } from '../test/fakes'

const semBody = (init?: RequestInit) => init?.body === '{}' // a chamada que "acorda" a função ao abrir o checkout

function abrir(opcoes: Parameters<typeof renderComTudo>[1] = { sessao: logada() }) {
  semearCatalogo()
  semearCarrinho(['produto-a'])
  instalarTabelas(() => ({ data: [], error: null }))
  return renderComTudo({ rota: '/checkout' }, opcoes)
}

const enviar = async (usuario: ReturnType<typeof renderComTudo>['usuario']) => usuario.click(await screen.findByRole('button', { name: 'Enviar pedido' }))

describe('Checkout', () => {
  it('UT-325 sucesso: "Ver meus pedidos" ao lado de "Continuar no WhatsApp"', async () => {
    fetchErp({ 'loja-criar-pedido': (init) => (semBody(init) ? respostaJson({}) : respostaJson({ numero: 50, total: 10 })) })
    const { usuario } = abrir()
    await enviar(usuario)
    expect(await screen.findByRole('heading', { name: 'Pedido nº 50 recebido!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver meus pedidos' })).toHaveAttribute('href', '/pedidos')
    expect(screen.getByRole('link', { name: 'Continuar no WhatsApp' })).toBeInTheDocument()
  })

  it('UT-326 sucesso apaga o cache de pedidos do comprador (e só o dele)', async () => {
    semearPedidos('u1', [pedidoFalso(1)])
    semearPedidos('u2', [pedidoFalso(2)])
    fetchErp({ 'loja-criar-pedido': (init) => (semBody(init) ? respostaJson({}) : respostaJson({ numero: 50, total: 10 })) })
    const { usuario } = abrir()
    await enviar(usuario)
    await screen.findByRole('heading', { name: 'Pedido nº 50 recebido!' })
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(localStorage.getItem('loja-pedidos:u2')).not.toBeNull()
  })

  it('UT-327 sem login: Entrar e Criar conta voltam para o checkout', async () => {
    abrir({ sessao: null })
    expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?voltar=/checkout')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro?voltar=/checkout')
  })

  it('UT-398 carrinho vazio', async () => {
    renderComTudo({ rota: '/checkout' }, { sessao: logada() })
    expect(await screen.findByRole('heading', { name: 'Nada para finalizar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos')
  })

  it('UT-399 401 ao enviar: aviso de sessão e o formulário continua preenchido', async () => {
    fetchErp({ 'loja-criar-pedido': (init) => (semBody(init) ? respostaJson({}) : respostaJson({}, 401)) })
    const { usuario } = abrir()
    const obs = await screen.findByLabelText('Observações (opcional)')
    await usuario.type(obs, 'Entregar de manhã')
    await enviar(usuario)
    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
    expect(obs).toHaveValue('Entregar de manhã')
    expect(screen.getByRole('button', { name: 'Enviar pedido' })).toBeEnabled()
  })

  it('IT-015 sucesso limpa carrinho e cache; "Ver meus pedidos" mostra a lista nova', async () => {
    semearPedidos('u1', [pedidoFalso(1)])
    let pedidos = [pedidoFalso(1)]
    const fetchFalso = fetchErp({
      'loja-criar-pedido': (init) => {
        if (semBody(init)) return respostaJson({})
        pedidos = [pedidoFalso(50), ...pedidos]
        return respostaJson({ numero: 50, total: 10 })
      },
      'loja-meus-pedidos': () => respostaJson({ pedidos }),
    })
    const { usuario, router, container } = abrir()
    await enviar(usuario)
    await screen.findByRole('heading', { name: 'Pedido nº 50 recebido!' })
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(container.querySelector('.contador')).toBeNull()
    expect(chamadasPedidos(fetchFalso)).toBe(0)
    await usuario.click(screen.getByRole('link', { name: 'Ver meus pedidos' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pedidos'))
    expect(await screen.findByText('Pedido nº 50')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getAllByRole('link', { name: /Pedido nº/ })).toHaveLength(2)
  })
})
