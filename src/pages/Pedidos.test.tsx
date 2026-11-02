import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { chamadasPedidos, fetchErp, logada, pedidoFalso, respostaJson, semearPedidos } from '../test/dados'
import { supabaseFake } from '../test/fakes'

const abrir = (opcoes: Parameters<typeof renderComTudo>[1] = {}) => renderComTudo({ rota: '/pedidos' }, { sessao: logada(), ...opcoes })

/** Lista já no cache e ERP que não responde: a tela mostra só o que está guardado. */
function comCache(pedidos: ReturnType<typeof pedidoFalso>[], opcoes: Parameters<typeof renderComTudo>[1] = {}) {
  semearPedidos('u1', pedidos)
  fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>(() => {}) })
  return abrir(opcoes)
}

describe('Pedidos', () => {
  it('UT-264 cartão com número, data, chip, total e resumo', async () => {
    comCache([pedidoFalso(12), pedidoFalso(11, { data: '2026-03-10T15:00:00Z' })])
    const cartao = (await screen.findByText('Pedido nº 12')).closest('a')!
    expect(within(cartao).getByText('15/03/2026')).toBeInTheDocument()
    expect(within(cartao).getByText('Em produção')).toHaveClass('chip')
    expect(within(cartao).getByText('R$ 120,00')).toBeInTheDocument()
    const resumo = within(cartao).getByText('3 itens · Cartão de visita e mais 2')
    expect(resumo).toHaveClass('truncar')
    expect(screen.getAllByRole('link', { name: /Pedido nº/ })).toHaveLength(2)
  })

  it('UT-265 carregando mostra três esqueletos e nenhum texto de espera', async () => {
    fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>(() => {}) })
    const { container } = abrir()
    await screen.findByRole('heading', { name: 'Meus pedidos' })
    expect(container.querySelectorAll('.esqueleto-cartao')).toHaveLength(3)
    expect(screen.queryByText(/carregando/i)).toBeNull()
  })

  it.each([
    [1, 'etapa-1'],
    [2, 'etapa-2'],
    [3, 'etapa-3'],
    [4, 'etapa-4'],
    [0, 'cancelado'],
  ])('UT-266 etapa %i → chip %s', async (etapa, classe) => {
    const { container } = comCache([pedidoFalso(1, { etapa, situacao: '' })])
    await screen.findByText('Pedido nº 1')
    expect(container.querySelector('.chip')).toHaveClass(classe)
  })

  it('UT-267 etapa desconhecida → chip neutro com a situação, ou Em andamento', async () => {
    const { container } = comCache([pedidoFalso(2, { etapa: 9, situacao: '' }), pedidoFalso(1, { etapa: 9, situacao: 'Aguardando arte', data: '2026-01-01' })])
    await screen.findByText('Pedido nº 1')
    const chips = [...container.querySelectorAll('.chip')]
    expect(chips.map((c) => c.className)).toEqual(['chip neutro', 'chip neutro'])
    expect(chips.map((c) => c.textContent)).toEqual(['Em andamento', 'Aguardando arte'])
  })

  it('UT-268 sem itens → Sem itens', async () => {
    comCache([pedidoFalso(1, { itens: [] })])
    expect(await screen.findByText('Sem itens')).toBeInTheDocument()
  })

  it('UT-269 total inválido → travessão', async () => {
    comCache([pedidoFalso(1, { total: 'abc' as unknown as number })])
    expect(await screen.findByText('—')).toBeInTheDocument()
  })

  it('UT-270 falha ao atualizar: aviso com Tentar de novo que busca outra vez', async () => {
    semearPedidos('u1', [pedidoFalso(1)])
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => respostaJson({ erro: 'x' }, 500) })
    const { usuario } = abrir()
    expect(await screen.findByText(/Não foi possível atualizar/)).toBeInTheDocument()
    expect(screen.getByText('Pedido nº 1')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() => expect(chamadasPedidos(fetchFalso)).toBe(2))
  })

  it('UT-271 sem pedidos → mensagem e link para os produtos', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [] }) })
    abrir()
    expect(await screen.findByText('Você ainda não fez pedidos.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos')
  })

  it('UT-272 primeira carga falhou → mensagem e botão; durante a nova busca o botão fica desligado', async () => {
    let resposta = () => respostaJson({ erro: 'x' }, 500)
    let liberar!: () => void
    fetchErp({ 'loja-meus-pedidos': () => resposta() })
    const { usuario } = abrir()
    expect(await screen.findByText('Não conseguimos carregar seus pedidos.')).toBeInTheDocument()
    resposta = () => respostaJson({ pedidos: [pedidoFalso(1)] })
    const segurada = new Promise<Response>((ok) => (liberar = () => ok(respostaJson({ pedidos: [pedidoFalso(1)] }))))
    fetchErp({ 'loja-meus-pedidos': () => segurada })
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeDisabled()
    await act(async () => liberar())
    expect(await screen.findByText('Pedido nº 1')).toBeInTheDocument()
  })

  it('UT-273 sessão vencida → mensagem de sessão expirada', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({}, 401) })
    abrir()
    expect(await screen.findByRole('heading', { name: 'Sua sessão expirou. Entre novamente.' })).toBeInTheDocument()
  })

  it('UT-274 computador: botão Atualizar, sem puxar para atualizar', async () => {
    semearPedidos('u1', [pedidoFalso(1)])
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [pedidoFalso(1)] }) })
    const { usuario } = abrir({ mobile: false })
    await waitFor(() => expect(screen.queryByText('Atualizando...')).toBeNull())
    await usuario.click(await screen.findByRole('button', { name: /Atualizar/ }))
    await waitFor(() => expect(chamadasPedidos(fetchFalso)).toBe(2))
    expect(document.documentElement).not.toHaveClass('sem-ptr-nativo')
  })

  it('celular: sem botão Atualizar; puxar para atualizar ativo', async () => {
    comCache([pedidoFalso(1)])
    await screen.findByText('Pedido nº 1')
    expect(screen.queryByRole('button', { name: /Atualizar/ })).toBeNull()
    expect(document.documentElement).toHaveClass('sem-ptr-nativo')
  })

  it('UT-275 o cartão é um link para o detalhe', async () => {
    comCache([pedidoFalso(12)])
    expect((await screen.findByText('Pedido nº 12')).closest('a')).toHaveAttribute('href', '/pedidos/12')
  })

  it('UT-276 dois pedidos com o mesmo número aparecem os dois', async () => {
    comCache([pedidoFalso(5), pedidoFalso(5)])
    await screen.findAllByText('Pedido nº 5')
    expect(screen.getAllByText('Pedido nº 5')).toHaveLength(2)
  })

  it('UT-277 150 pedidos viram 150 cartões', async () => {
    const { container } = comCache(Array.from({ length: 150 }, (_, i) => pedidoFalso(i + 1)))
    await screen.findByText('Pedido nº 150')
    expect(container.querySelectorAll('a.cartao-pedido')).toHaveLength(150)
  })
})

describe('Pedidos (integração)', () => {
  it('IT-012 cache aparece na hora; a resposta atualiza a mesma lista sem refazê-la', async () => {
    semearPedidos('u1', [pedidoFalso(1), pedidoFalso(2)])
    let responder!: () => void
    fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>((ok) => (responder = () => ok(respostaJson({ pedidos: [pedidoFalso(1), pedidoFalso(2), pedidoFalso(3)] })))) })
    const { container } = abrir()
    await screen.findByText('Pedido nº 2')
    expect(container.querySelectorAll('a.cartao-pedido')).toHaveLength(2)
    expect(screen.queryByText('Atualizando...')).toBeNull()
    const lista = container.querySelector('.lista-pedidos')
    const antes = window.scrollY
    await waitFor(() => expect(responder).toBeTypeOf('function'))
    await act(async () => responder())
    await waitFor(() => expect(container.querySelectorAll('a.cartao-pedido')).toHaveLength(3))
    expect(container.querySelector('.lista-pedidos')).toBe(lista)
    expect(window.scrollY).toBe(antes)
    expect(screen.queryByText('Atualizando...')).toBeNull()
    expect(JSON.parse(localStorage.getItem('loja-pedidos:u1')!).pedidos).toHaveLength(3)
  })

  it('IT-013 401: mensagem de sessão, signOut, cache apagado e Entrar volta para /pedidos', async () => {
    semearPedidos('u1', [pedidoFalso(1)])
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({}, 401) })
    const { usuario, router } = abrir()
    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    await usuario.click(within(screen.getByRole('main')).getByRole('link', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.search).toBe('?voltar=%2Fpedidos')
  })

  it('IT-014 abrir um pedido usa o cache sem nova busca; número inexistente → não encontrado', async () => {
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [pedidoFalso(12), pedidoFalso(13)] }) })
    const { usuario, router } = abrir()
    await usuario.click(await screen.findByRole('link', { name: /Pedido nº 12/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pedidos/12'))
    expect(await screen.findByText('Feito em 15/03/2026')).toBeInTheDocument()
    expect(chamadasPedidos(fetchFalso)).toBe(1)
    await act(() => router.navigate('/pedidos/999'))
    expect(await screen.findByText('Pedido não encontrado')).toBeInTheDocument()
  })

  it('puxar para atualizar na lista chama o ERP de novo', async () => {
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [pedidoFalso(1)] }) })
    abrir()
    const cartao = await screen.findByText('Pedido nº 1')
    await waitFor(() => expect(screen.queryByText('Atualizando...')).toBeNull())
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    const alvo = cartao.closest('.container')!
    await act(async () => {
      fireEvent.touchStart(alvo, { touches: [{ clientY: 100 }] })
      fireEvent.touchMove(alvo, { touches: [{ clientY: 200 }] })
      fireEvent.touchEnd(alvo)
    })
    await waitFor(() => expect(chamadasPedidos(fetchFalso)).toBe(2))
    Reflect.deleteProperty(window, 'scrollY')
  })
})
