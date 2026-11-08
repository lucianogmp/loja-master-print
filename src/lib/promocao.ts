// Promoção só do site. O preço "de" é o preço de venda do ERP; a promoção diz o preço "por".
// ATENÇÃO: a mesma regra roda na função loja-criar-pedido (ERP), que é quem vale no pedido.

export type Promocao = { tipo: 'percentual' | 'preco'; valor: number }

const r2 = (n: number) => Math.round(n * 100) / 100

/** Preço com a promoção. Promoção inválida (ou "por" ≥ "de") não muda o preço. */
export function precoComPromocao(preco: number, promo?: Promocao | null): number {
  if (!promo || !(promo.valor > 0)) return preco
  if (promo.tipo === 'percentual' && promo.valor < 100) return r2(preco * (1 - promo.valor / 100))
  if (promo.tipo === 'preco' && promo.valor < preco) return r2(promo.valor)
  return preco
}

/** Percentual de desconto arredondado para mostrar ("-20%"); 0 se não há promoção. */
export function percentualDesconto(de: number, por: number): number {
  return de > 0 && por < de ? Math.round((1 - por / de) * 100) : 0
}
