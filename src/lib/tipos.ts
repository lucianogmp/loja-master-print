// Tipos do catálogo. Os dados vêm do ERP pela função pública loja_catalogo().

export type TipoPreco = 'pacote' | 'unidade' | 'm2' | 'consulta'

export type Variacao = {
  id: string
  label: string
  // pacote/unidade: preço do pacote ou da unidade. m2: preço por m². consulta: ignorado.
  preco: number
}

export type Categoria = {
  slug: string
  nome: string
  arte: ArteTipo
  imagem?: string // foto da categoria na loja
  ordem: number
}

export type ArteTipo = 'cartao' | 'adesivo' | 'banner' | 'impresso' | 'placa' | 'quadro'

export type Produto = {
  id: string
  slug: string
  nome: string
  categoria: string
  arte: ArteTipo
  resumo: string
  descricao: string
  imagens: string[]
  // Envio: usado no cálculo do frete (peso em kg, pacote em cm) e na regra "só retirada".
  pesoKg?: number
  pacoteCm?: { comprimento: number; largura: number; altura: number }
  entregaModo: 'envio_e_retirada' | 'so_retirada'
  tipoPreco: TipoPreco
  variacoes: Variacao[]
  rotuloVariacao: string
  // Para tipoPreco 'pacote': quantidade fechada de cada variação (ex.: 500 cartões)
  quantidadeFechada?: number
  prazo: string
  precisaArte: boolean
  destaque?: boolean
  maisVendido?: boolean // só vem do banco quando há venda real
  // Produto derivado: usa preço, prazo e produção de um produto do ERP, mas com arte pronta própria
  derivadoId?: string
  arteFixa?: boolean
}

