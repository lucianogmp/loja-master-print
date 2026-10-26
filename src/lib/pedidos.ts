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

export function usePedidos() {
  const { session } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    if (!session) return
    setCarregando(true)
    setErro('')
    try {
      setPedidos(await buscarPedidos(session.access_token))
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
