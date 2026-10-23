import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCatalogo } from './catalogo'
import { calcularTotal, type OpcaoArte } from './preco'

export type ItemCarrinho = {
  id: string
  slug: string
  variacaoId: string
  quantidade: number
  larguraCm?: number
  alturaCm?: number
  arte: OpcaoArte
  observacao: string
}

type CartCtx = {
  itens: ItemCarrinho[]
  adicionar: (item: Omit<ItemCarrinho, 'id'>) => void
  remover: (id: string) => void
  limpar: () => void
  totalItens: number
  subtotal: number
  temSobConsulta: boolean
}

const Ctx = createContext<CartCtx | null>(null)
const CHAVE = 'master-print-carrinho'

function carregar(): ItemCarrinho[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as ItemCarrinho[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { produtoPorSlug } = useCatalogo()
  const [itens, setItens] = useState<ItemCarrinho[]>(carregar)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens))
    } catch {
      // sem armazenamento disponível: o carrinho vale só nesta sessão
    }
  }, [itens])

  const valor = useMemo<CartCtx>(() => {
    let subtotal = 0
    let temSobConsulta = false
    for (const item of itens) {
      const produto = produtoPorSlug(item.slug)
      if (!produto) continue
      const total = calcularTotal(produto, item)
      if (total === null) temSobConsulta = true
      else subtotal += total
    }
    return {
      itens,
      adicionar: (item) =>
        setItens((atual) => [...atual, { ...item, id: crypto.randomUUID() }]),
      remover: (id) => setItens((atual) => atual.filter((i) => i.id !== id)),
      limpar: () => setItens([]),
      totalItens: itens.length,
      subtotal,
      temSobConsulta,
    }
  }, [itens, produtoPorSlug])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart precisa estar dentro de CartProvider')
  return ctx
}
