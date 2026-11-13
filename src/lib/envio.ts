import { ERP_URL } from './erp'
import type { Produto } from './tipos'

/** Envio pelos Correios só vale para produto com peso e medidas do pacote e que não seja "somente retirada". */
export function envioPronto(p: Produto): boolean {
  return p.entregaModo !== 'so_retirada' && !!p.pesoKg && p.pesoKg > 0 && !!p.pacoteCm
}

export type OpcaoFrete = { codigo: string; nome: string; valor: number; prazo: number | null }
export type ResultadoFrete =
  | { ok: true; opcoes: OpcaoFrete[]; gratis: boolean }
  | { ok: false; erro: string; indisponivel?: boolean }

/** Pergunta à função do servidor o frete do carrinho; o preço sempre vem dos Correios, nunca daqui. */
export async function consultarFrete(cep: string, itens: { produto_id: string; quantidade: number }[]): Promise<ResultadoFrete> {
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
