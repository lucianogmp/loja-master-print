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
  grupo: string // slug do grupo da loja
}

export type Grupo = {
  slug: string
  nome: string
  arte: ArteTipo
  ordem: number
}

export type ArteTipo = 'cartao' | 'adesivo' | 'banner' | 'impresso' | 'placa' | 'quadro'

export type Produto = {
  id: string
  slug: string
  nome: string
  categoria: string
  grupo: string
  arte: ArteTipo
  resumo: string
  descricao: string
  imagens: string[]
  medidas?: string
  infoEnvio?: string
  tipoPreco: TipoPreco
  variacoes: Variacao[]
  rotuloVariacao: string
  // Para tipoPreco 'pacote': quantidade fechada de cada variação (ex.: 500 cartões)
  quantidadeFechada?: number
  prazo: string
  precisaArte: boolean
  destaque?: boolean
}

