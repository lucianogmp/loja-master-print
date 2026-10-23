import type { Produto, Variacao } from '../data/produtos'

export type OpcaoArte = 'propria' | 'ajuda' | 'modelo'

export const rotuloArte: Record<OpcaoArte, string> = {
  propria: 'Vou enviar minha arte',
  ajuda: 'Preciso de ajuda com a arte',
  modelo: 'Usar um modelo da gráfica',
}

export type Configuracao = {
  variacaoId: string
  quantidade: number
  larguraCm?: number
  alturaCm?: number
}

export function areaM2(larguraCm?: number, alturaCm?: number) {
  if (!larguraCm || !alturaCm) return 0
  return (larguraCm / 100) * (alturaCm / 100)
}

/**
 * Cálculo de EXEMPLO para a prévia. As regras reais virão do ERP
 * e devem ser revalidadas no backend antes de qualquer cobrança.
 * Retorna null quando o produto é sob consulta ou a configuração está incompleta.
 */
export function calcularTotal(produto: Produto, cfg: Configuracao): number | null {
  if (produto.tipoPreco === 'consulta') return null
  const variacao: Variacao | undefined = produto.variacoes.find((v) => v.id === cfg.variacaoId)
  if (!variacao || cfg.quantidade < 1) return null

  if (produto.tipoPreco === 'm2') {
    const area = areaM2(cfg.larguraCm, cfg.alturaCm)
    if (area <= 0) return null
    return arredondar(area * variacao.preco * cfg.quantidade)
  }
  // pacote e unidade: preço da variação × quantidade escolhida
  return arredondar(variacao.preco * cfg.quantidade)
}

function arredondar(n: number) {
  return Math.round(n * 100) / 100
}
