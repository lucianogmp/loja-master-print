import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth'
import { buscarPedidos, ErroPedidos, etapaInfo, limparCachePedidos, mensagemWhatsAppPedido, resumoItens, totalFormatado, usePedidos } from './pedidos'
import { chamadasPedidos, fetchErp, pedidoFalso, respostaJson, semearPedidos } from '../test/dados'
import { sessaoFake, supabaseFake } from '../test/fakes'

// O hook só monta com a sessão já carregada (como nas telas, atrás do RequerSessao)
function Porta({ children }: { children: ReactNode }) {
  const { carregando } = useAuth()
  return carregando ? null : <>{children}</>
}
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <Porta>{children}</Porta>
  </AuthProvider>
)

async function montar(userId = 'u1') {
  supabaseFake.auth.sessao = sessaoFake({ id: userId })
  const r = renderHook(() => usePedidos(), { wrapper })
  await waitFor(() => expect(r.result.current).not.toBeNull())
  return r
}

/** Resposta do ERP que só chega quando `liberar()` é chamado (deixa ver o estado "carregando"). */
function segurar(pedidos: ReturnType<typeof pedidoFalso>[]) {
  const seg = { liberar: () => {} }
  const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>((ok) => (seg.liberar = () => ok(respostaJson({ pedidos })))) })
  return { seg, fetchFalso }
}

const lista = (...numeros: number[]) => numeros.map((n) => pedidoFalso(n))

describe('buscarPedidos', () => {
  it('UT-047 devolve a lista e envia o token no cabeçalho', async () => {
    const p1 = pedidoFalso(1)
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [p1] }) })
    await expect(buscarPedidos('t')).resolves.toEqual([p1])
    const [url, init] = fetchFalso.mock.calls[0]
    expect(String(url)).toBe('https://erp.teste/functions/v1/loja-meus-pedidos')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{}')
    expect((init?.headers as Record<string, string>)['x-comprador-token']).toBe('t')
  })

  it.each([
    ['UT-048', 401],
    ['UT-049', 403],
  ])('%s %i → ErroPedidos sessao', async (_id, status) => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({}, status) })
    await expect(buscarPedidos('t')).rejects.toMatchObject({ name: 'ErroPedidos', codigo: 'sessao' })
  })

  it('UT-050 500 com mensagem → servidor com a mensagem do ERP', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ erro: 'fora do ar' }, 500) })
    const erro = await buscarPedidos('t').catch((e) => e)
    expect(erro).toBeInstanceOf(ErroPedidos)
    expect(erro).toMatchObject({ codigo: 'servidor', message: 'fora do ar' })
  })

  it('UT-051 fetch que falha → rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(buscarPedidos('t')).rejects.toMatchObject({ codigo: 'rede' })
  })

  it('UT-052 502 sem JSON → servidor com a mensagem padrão', async () => {
    fetchErp({ 'loja-meus-pedidos': () => new Response('<html>', { status: 502 }) })
    await expect(buscarPedidos('t')).rejects.toMatchObject({ codigo: 'servidor', message: 'Não foi possível carregar seus pedidos.' })
  })
})

describe('etapaInfo', () => {
  it('UT-053 etapa 0 é cancelado e guarda a situação', () => {
    expect(etapaInfo(0, 'Cancelado pelo cliente')).toEqual({ cancelado: true, rotulo: 'Cancelado', indice: null, nota: 'Cancelado pelo cliente' })
  })

  it.each([
    [1, 'Recebido', 0],
    [2, 'Em produção', 1],
    [3, 'Pronto', 2],
    [4, 'Entregue', 3],
  ])('UT-054 etapa %i → %s', (etapa, rotulo, indice) => {
    expect(etapaInfo(etapa, rotulo)).toMatchObject({ rotulo, indice, cancelado: false })
  })

  it('UT-055 etapa desconhecida usa a situação como rótulo', () => {
    expect(etapaInfo(7, 'Aguardando arte')).toMatchObject({ indice: null, rotulo: 'Aguardando arte', cancelado: false })
  })

  it('UT-056 sem etapa nem situação → Em andamento', () => {
    expect(etapaInfo(undefined, '')).toMatchObject({ rotulo: 'Em andamento', indice: null })
    expect(etapaInfo('x', '')).toMatchObject({ rotulo: 'Em andamento', indice: null })
  })

  it('UT-057 situação diferente do passo vira nota', () => {
    expect(etapaInfo(2, 'Impressão iniciada').nota).toBe('Impressão iniciada')
  })

  it('UT-058 situação igual ao passo (sem maiúsculas) não vira nota', () => {
    expect(etapaInfo(2, 'em PRODUÇÃO').nota).toBeNull()
  })
})

describe('resumoItens, mensagem e total', () => {
  const com = (n: number) => pedidoFalso(1, { itens: Array.from({ length: n }, (_, i) => ({ descricao: i === 0 ? 'Cartão de visita' : `Item ${i}`, quantidade: 1, preco_unitario: 1, total: 1 })) })

  it('UT-059 três itens', () => expect(resumoItens(com(3))).toBe('3 itens · Cartão de visita e mais 2'))
  it('UT-060 um item', () => expect(resumoItens(pedidoFalso(1, { itens: [{ descricao: 'Banner 1x1', quantidade: 1, preco_unitario: 1, total: 1 }] }))).toBe('1 item · Banner 1x1'))
  it('UT-061 sem itens', () => expect(resumoItens(com(0))).toBe('Sem itens'))
  it('UT-062 mensagem do WhatsApp', () => expect(mensagemWhatsAppPedido(12)).toBe('Olá! Quero falar sobre o pedido nº 12.'))
  it('UT-076 total formatado', () => {
    expect(totalFormatado(Number.NaN)).toBe('—')
    expect(totalFormatado(undefined)).toBe('—')
    expect(totalFormatado(12.5).replace(/\s/g, ' ')).toBe('R$ 12,50')
  })
})

describe('usePedidos', () => {
  afterEach(() => vi.restoreAllMocks())

  it('UT-063 grava o cache do comprador depois de carregar', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: lista(1) }) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.carregando).toBe(false))
    const salvo = JSON.parse(localStorage.getItem('loja-pedidos:u1')!)
    expect(salvo).toMatchObject({ v: 1, userId: 'u1', pedidos: [{ numero: 1 }] })
    expect(Number.isNaN(Date.parse(salvo.salvoEm))).toBe(false)
  })

  it('UT-064 com cache: lista na hora, atualiza em segundo plano, uma busca', async () => {
    semearPedidos('u1', lista(1, 2))
    let liberar!: () => void
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>((ok) => (liberar = () => ok(respostaJson({ pedidos: lista(1, 2, 3) })))) })
    const { result } = await montar()
    expect(result.current).toMatchObject({ carregando: false, atualizando: true })
    expect(result.current.pedidos.map((p) => p.numero)).toEqual([2, 1])
    await waitFor(() => expect(liberar).toBeTypeOf('function'))
    await act(async () => liberar())
    await waitFor(() => expect(result.current.atualizando).toBe(false))
    expect(result.current.pedidos).toHaveLength(3)
    expect(chamadasPedidos(fetchFalso)).toBe(1)
  })

  it('UT-065 sem cache: carregando até chegar, depois grava', async () => {
    const { seg } = segurar(lista(5))
    const { result } = await montar()
    expect(result.current.carregando).toBe(true)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
    await act(async () => seg.liberar())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.pedidos.map((p) => p.numero)).toEqual([5])
    expect(localStorage.getItem('loja-pedidos:u1')).not.toBeNull()
  })

  it('UT-066 falha com cache: mantém a lista e avisa', async () => {
    semearPedidos('u1', lista(1, 2))
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ erro: 'x' }, 500) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.erroAtualizacao).toBe(true))
    expect(result.current.pedidos).toHaveLength(2)
    expect(result.current.erro).toBeNull()
  })

  it('UT-067 lista vazia por cima de cache cheio conta como falha', async () => {
    semearPedidos('u1', lista(1, 2))
    const antes = localStorage.getItem('loja-pedidos:u1')
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [] }) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.erroAtualizacao).toBe(true))
    expect(result.current.pedidos).toHaveLength(2)
    expect(localStorage.getItem('loja-pedidos:u1')).toBe(antes)
  })

  it('UT-068 sem cache e sem pedidos: lista vazia sem erro', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [] }) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current).toMatchObject({ pedidos: [], erro: null, erroAtualizacao: false })
  })

  it('UT-069 401: sessão expirada, cache apagado, marcarSessaoExpirada uma vez', async () => {
    semearPedidos('u1', lista(1))
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({}, 401) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.sessaoExpirada).toBe(true))
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    await waitFor(() => expect(supabaseFake.auth.signOut).toHaveBeenCalledTimes(1))
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('UT-070 dois recarregar() seguidos fazem uma busca só', async () => {
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: lista(1) }) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.carregando).toBe(false))
    fetchFalso.mockClear()
    let a!: Promise<void>, b!: Promise<void>
    act(() => {
      a = result.current.recarregar()
      b = result.current.recarregar()
    })
    await act(async () => void (await Promise.all([a, b])))
    expect(chamadasPedidos(fetchFalso)).toBe(1)
  })

  it('UT-071 limparCachePedidos(uid) tira só o comprador pedido', () => {
    semearPedidos('u1', lista(1))
    semearPedidos('u2', lista(2))
    limparCachePedidos('u1')
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(localStorage.getItem('loja-pedidos:u2')).not.toBeNull()
  })

  it('UT-072 limparCachePedidos() tira todos', () => {
    semearPedidos('u1', lista(1))
    semearPedidos('u2', lista(2))
    localStorage.setItem('outra', '1')
    limparCachePedidos()
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(localStorage.getItem('loja-pedidos:u2')).toBeNull()
    expect(localStorage.getItem('outra')).toBe('1')
  })

  it('UT-073 cache de outro comprador é ignorado', async () => {
    semearPedidos('u2', lista(9))
    fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>(() => {}) })
    const { result } = await montar('u1')
    expect(result.current.carregando).toBe(true)
    expect(result.current.pedidos).toEqual([])
  })

  it('UT-074 cache de outra versão é ignorado e regravado', async () => {
    localStorage.setItem('loja-pedidos:u1', JSON.stringify({ v: 0, userId: 'u1', salvoEm: '2026-01-01', pedidos: lista(9) }))
    const { seg } = segurar(lista(1))
    const { result } = await montar()
    expect(result.current.carregando).toBe(true)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
    await act(async () => seg.liberar())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(JSON.parse(localStorage.getItem('loja-pedidos:u1')!).v).toBe(1)
  })

  it('UT-075 mais novos primeiro, desempate pelo número', async () => {
    const dados = [
      pedidoFalso(1, { data: '2026-01-01' }),
      pedidoFalso(2, { data: '2026-03-01' }),
      pedidoFalso(3, { data: '2026-03-01' }),
    ]
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: dados }) })
    const { result } = await montar()
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.pedidos.map((p) => p.numero)).toEqual([3, 2, 1])
  })

  it('UT-381 armazenamento que falha: carrega como primeira vez, sem erro', async () => {
    const aviso = vi.spyOn(console, 'error')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cheio')
    })
    const { seg, fetchFalso } = segurar(lista(4))
    const { result } = await montar()
    expect(result.current.carregando).toBe(true)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
    await act(async () => seg.liberar())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.pedidos.map((p) => p.numero)).toEqual([4])
    expect(chamadasPedidos(fetchFalso)).toBe(1)
    expect(aviso).not.toHaveBeenCalled()
  })

  it('UT-395 sair com a busca em andamento: a resposta não é gravada nem mostrada', async () => {
    let liberar!: () => void
    fetchErp({ 'loja-meus-pedidos': () => new Promise<Response>((ok) => (liberar = () => ok(respostaJson({ pedidos: lista(1) })))) })
    const { result } = await montar()
    await waitFor(() => expect(liberar).toBeTypeOf('function'))
    act(() => limparCachePedidos()) // o que `sair()` faz
    await act(async () => liberar())
    expect(localStorage.getItem('loja-pedidos:u1')).toBeNull()
    expect(result.current.pedidos).toEqual([])
  })

  it('erro de rede sem cache vira mensagem de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')))
    const { result } = await montar()
    await waitFor(() => expect(result.current.erro).toBe('Sem conexão. Tente novamente.'))
    expect(result.current.carregando).toBe(false)
  })
})
