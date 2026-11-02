import { vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import type { Pedido } from '../lib/pedidos'
import { definirRpc, linhasCatalogo, sessaoFake } from './fakes'

export const CATEGORIAS = [
  { slug: 'a', nome: 'A' },
  { slug: 'b', nome: 'B' },
]

/** Catálogo com um produto por categoria (`produto-<slug>`). */
export function semearCatalogo(categorias = CATEGORIAS) {
  definirRpc('loja_catalogo_v2', linhasCatalogo(categorias))
}

/** Configuração da loja (`loja_config`): só os campos dados mudam. */
export function semearConfig(empresa: Record<string, string> = {}) {
  definirRpc('loja_config', { empresa: { nome: 'Master Print', horario: 'Seg a sex, 8h-18h', whatsapp: '5533998139539', ...empresa } })
}

export function semearCarrinho(slugs: string[]) {
  localStorage.setItem(
    'master-print-carrinho',
    JSON.stringify(slugs.map((slug, i) => ({ id: `i${i}`, slug, variacaoId: '', quantidade: 1, arte: 'propria', observacao: '' }))),
  )
}

export const logada = (): Session => sessaoFake({ nome: 'Ana Souza', email: 'ana@exemplo.com' })

// ---------- Pedidos ----------

export function pedidoFalso(numero = 12, extra: Partial<Pedido> = {}): Pedido {
  return {
    numero,
    data: '2026-03-15T15:00:00Z',
    total: 120,
    etapa: 2,
    situacao: 'Em produção',
    recebimento: 'Entrega',
    endereco: 'Rua A, 1 — Centro, Teófilo Otoni/MG',
    itens: [
      { descricao: 'Cartão de visita', quantidade: 500, preco_unitario: 0.1, total: 50 },
      { descricao: 'Banner', quantidade: 1, preco_unitario: 60, total: 60 },
      { descricao: 'Adesivo', quantidade: 10, preco_unitario: 1, total: 10 },
    ],
    ...extra,
  }
}

/** Grava o cache de pedidos de um comprador como o app grava (data antiga: a busca em segundo plano roda). */
export function semearPedidos(userId: string, pedidos: Pedido[], salvoEm = '2026-01-01T00:00:00Z') {
  localStorage.setItem(`loja-pedidos:${userId}`, JSON.stringify({ v: 1, userId, salvoEm, pedidos }))
}

export const respostaJson = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

type Tratador = (init?: RequestInit) => Response | Promise<Response>

/** Troca o `fetch` global: cada função do ERP (pelo fim do caminho) responde com o tratador dado; o resto devolve `{}`. */
export function fetchErp(funcoes: Record<string, Tratador>) {
  const fn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const alvo = Object.keys(funcoes).find((k) => String(url).endsWith(k))
    return alvo ? funcoes[alvo](init) : respostaJson({})
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

export const chamadasPedidos = (fn: ReturnType<typeof fetchErp>) => fn.mock.calls.filter(([u]) => String(u).endsWith('loja-meus-pedidos')).length
