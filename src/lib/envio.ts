import { ERP_URL } from './erp'
import type { Produto } from './tipos'

/** Envio pelos Correios só vale para produto com peso e medidas do pacote e que não seja "somente retirada". */
export function envioPronto(p: Produto, variacaoId?: string): boolean {
  if (p.entregaModo === 'so_retirada' || !p.pacoteCm) return false
  // Quantidades fechadas: cada opção pode ter o próprio peso; sem ele vale o peso do produto
  if (p.temOpcoes) {
    const alvo = variacaoId ? p.variacoes.filter((v) => v.id === variacaoId) : p.variacoes
    return alvo.length > 0 && alvo.every((v) => (v.pesoKg ?? p.pesoKg ?? 0) > 0)
  }
  return !!p.pesoKg && p.pesoKg > 0
}

/** Quantidade da opção escolhida (ex.: 500), ou undefined quando o produto não tem quantidades fechadas. */
export function opcaoDoItem(p: Produto, variacaoId: string): number | undefined {
  return p.temOpcoes ? p.variacoes.find((v) => v.id === variacaoId)?.quantidade : undefined
}

export type OpcaoFrete = { codigo: string; nome: string; valor: number; prazo: number | null }
export type ResultadoFrete =
  | { ok: true; opcoes: OpcaoFrete[]; gratis: boolean }
  | { ok: false; erro: string; indisponivel?: boolean }

/** Pergunta à função do servidor o frete do carrinho; o preço sempre vem dos Correios, nunca daqui. */
export async function consultarFrete(cep: string, itens: { produto_id: string; quantidade: number; opcao?: number }[]): Promise<ResultadoFrete> {
  try {
    const r = await fetch(`${ERP_URL}/functions/v1/loja-frete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cep, itens }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, erro: j.erro ?? 'Não foi possível calcular o frete agora.', indisponivel: !!j.indisponivel }
    return { ok: true, opcoes: j.opcoes ?? [], gratis: !!j.gratis }
  } catch {
    return { ok: false, erro: 'Sem conexão. Tente de novo em instantes.' }
  }
}
