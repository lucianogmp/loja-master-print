import { useCallback, useEffect, useState } from 'react'
import { ERP_URL } from './erp'
import { useAuth } from './auth'

export type PedidoItem = { descricao: string; quantidade: number; preco_unitario: number; total: number }
export type Pedido = {
  numero: number
  data: string
  total: number
  etapa: number // 0 cancelado · 1 recebido · 2 em produção · 3 pronto · 4 entregue
  situacao: string
  recebimento: string
  endereco: string
  itens: PedidoItem[]
}

/** Histórico de pedidos do comprador logado (vem do ERP por uma função que só entrega os pedidos dele). */
export async function buscarPedidos(token: string): Promise<Pedido[]> {
  const r = await fetch(`${ERP_URL}/functions/v1/loja-meus-pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-comprador-token': token },
    body: '{}',
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.erro ?? 'Não foi possível carregar seus pedidos.')
  return j.pedidos as Pedido[]
}

// Cache em memória (some ao fechar a aba): a lista aparece na hora e é atualizada em seguida.
let cache: { userId: string; pedidos: Pedido[] } | null = null
let emAndamento: Promise<Pedido[]> | null = null

/** Começa a carregar os pedidos antes de a pessoa abrir a aba (chamado ao entrar na Minha conta). */
export function prefetchPedidos(token: string, userId: string) {
  if (emAndamento) return emAndamento
  emAndamento = buscarPedidos(token)
    .then((p) => {
      cache = { userId, pedidos: p }
      return p
    })
    .finally(() => {
      emAndamento = null
    })
  emAndamento.catch(() => {})
  return emAndamento
}

/** Chamar depois de fazer um pedido novo, para a lista não ficar desatualizada. */
export function limparCachePedidos() {
  cache = null
}

export function usePedidos() {
  const { session } = useAuth()
  const uid = session?.user.id
  const inicial = cache && cache.userId === uid ? cache.pedidos : null
  const [pedidos, setPedidos] = useState<Pedido[]>(inicial ?? [])
  const [carregando, setCarregando] = useState(!inicial)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    if (!session) return
    setErro('')
    try {
      const p = await prefetchPedidos(session.access_token, session.user.id)
      setPedidos(p)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar seus pedidos.')
    }
    setCarregando(false)
  }, [session])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { pedidos, carregando, erro, recarregar }
}
