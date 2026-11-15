import { ERP_URL } from './erp'
import type { Produto } from './tipos'

/** Envio pelos Correios só vale para produto com peso e medidas do pacote e que não seja "somente retirada". */
export function envioPronto(p: Produto, variacaoId?: string): boolean {
  // Grupo: cada variação é um produto do ERP com peso, medidas e modo de entrega próprios
  const variacaoPronta = (v: Produto['variacoes'][number]) =>
    v.produtoId ? !v.soRetirada && (v.pesoKg ?? 0) > 0 && !!v.pacoteCm : (v.pesoKg ?? p.pesoKg ?? 0) > 0
  if (p.temOpcoes) {
    const alvo = variacaoId ? p.variacoes.filter((v) => v.id === variacaoId) : p.variacoes
    const grupo = alvo.some((v) => v.produtoId)
    if (!grupo && (p.entregaModo === 'so_retirada' || !p.pacoteCm)) return false
    return alvo.length > 0 && alvo.every(variacaoPronta)
  }
  if (p.entregaModo === 'so_retirada' || !p.pacoteCm) return false
  return !!p.pesoKg && p.pesoKg > 0
}

/** Produto do ERP que entra no pedido: em grupo é o da variação escolhida; senão, o próprio produto. */
export function produtoIdDoItem(p: Produto, variacaoId: string): string {
  return p.variacoes.find((v) => v.id === variacaoId)?.produtoId ?? p.id
}

/** O item só pode ser retirado na gráfica? (em grupo vale o modo da variação escolhida) */
export function soRetiradaDoItem(p: Produto, variacaoId: string): boolean {
  const v = p.variacoes.find((x) => x.id === variacaoId)
  return v?.produtoId ? !!v.soRetirada : p.entregaModo === 'so_retirada'
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
