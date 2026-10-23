// DADOS DE EXEMPLO. Produtos, textos e preços abaixo são ILUSTRATIVOS.
// Na integração com o ERP, esta lista passa a vir do catálogo publicado no Supabase.

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
  tipoPreco: TipoPreco
  variacoes: Variacao[]
  rotuloVariacao: string
  // Para tipoPreco 'pacote': quantidade fechada de cada variação (ex.: 500 cartões)
  quantidadeFechada?: number
  prazo: string
  precisaArte: boolean
  destaque?: boolean
}

export const categorias: Categoria[] = [
  { slug: 'cartoes', nome: 'Cartões de visita', arte: 'cartao' },
  { slug: 'adesivos', nome: 'Adesivos', arte: 'adesivo' },
  { slug: 'banners', nome: 'Banners', arte: 'banner' },
  { slug: 'impressos', nome: 'Impressos', arte: 'impresso' },
  { slug: 'placas', nome: 'Placas', arte: 'placa' },
  { slug: 'quadros', nome: 'Quadros', arte: 'quadro' },
]

export const produtos: Produto[] = [
  {
    id: 'p1',
    slug: 'cartao-de-visita',
    nome: 'Cartão de visita',
    categoria: 'cartoes',
    arte: 'cartao',
    resumo: 'Papel couchê, 4x4 cores. Pacote fechado.',
    descricao:
      'Cartão de visita 9x5 cm, impressão frente e verso. Escolha o acabamento e a quantidade do pacote.',
    tipoPreco: 'pacote',
    rotuloVariacao: 'Acabamento',
    quantidadeFechada: 500,
    variacoes: [
      { id: 'fosco', label: 'Laminação fosca', preco: 89.9 },
      { id: 'brilho', label: 'Laminação brilho', preco: 84.9 },
      { id: 'verniz', label: 'Verniz localizado', preco: 119.9 },
    ],
    prazo: '3 a 5 dias úteis',
    precisaArte: true,
    destaque: true,
  },
  {
    id: 'p2',
    slug: 'adesivo-personalizado',
    nome: 'Adesivo personalizado',
    categoria: 'adesivos',
    arte: 'adesivo',
    resumo: 'Vinil com corte no formato. Sem instalação.',
    descricao:
      'Adesivos em vinil com impressão colorida e corte no formato da arte. Ideal para embalagens, produtos e brindes.',
    tipoPreco: 'm2',
    rotuloVariacao: 'Material',
    variacoes: [
      { id: 'vinil', label: 'Vinil branco', preco: 95 },
      { id: 'transparente', label: 'Vinil transparente', preco: 110 },
    ],
    prazo: '2 a 4 dias úteis',
    precisaArte: true,
    destaque: true,
  },
  {
    id: 'p3',
    slug: 'adesivo-para-vitrine',
    nome: 'Adesivo para vitrine',
    categoria: 'adesivos',
    arte: 'adesivo',
    resumo: 'Para o próprio cliente aplicar.',
    descricao:
      'Adesivo para vitrines e vidros, fácil de aplicar sem profissional. Informe a medida desejada.',
    tipoPreco: 'm2',
    rotuloVariacao: 'Tipo',
    variacoes: [
      { id: 'recorte', label: 'Recorte eletrônico', preco: 120 },
      { id: 'jateado', label: 'Efeito jateado', preco: 140 },
    ],
    prazo: '3 a 5 dias úteis',
    precisaArte: true,
  },
  {
    id: 'p4',
    slug: 'banner-em-lona',
    nome: 'Banner em lona',
    categoria: 'banners',
    arte: 'banner',
    resumo: 'Lona 440g com acabamento em ilhós.',
    descricao:
      'Banner em lona com impressão de alta resolução, acabamento com ilhós nas pontas. Informe a medida desejada.',
    tipoPreco: 'm2',
    rotuloVariacao: 'Acabamento',
    variacoes: [
      { id: 'ilhos', label: 'Ilhós nas pontas', preco: 75 },
      { id: 'bastao', label: 'Bastão e cordinha', preco: 85 },
    ],
    prazo: '2 a 3 dias úteis',
    precisaArte: true,
    destaque: true,
  },
  {
    id: 'p5',
    slug: 'flyer',
    nome: 'Flyer / panfleto',
    categoria: 'impressos',
    arte: 'impresso',
    resumo: 'A5, papel couchê 115g, colorido frente.',
    descricao:
      'Flyer A5 para divulgação, impressão colorida. Escolha o tamanho do pacote.',
    tipoPreco: 'pacote',
    rotuloVariacao: 'Quantidade',
    variacoes: [
      { id: '1000', label: '1.000 unidades', preco: 169.9 },
      { id: '2500', label: '2.500 unidades', preco: 329.9 },
      { id: '5000', label: '5.000 unidades', preco: 549.9 },
    ],
    prazo: '4 a 6 dias úteis',
    precisaArte: true,
  },
  {
    id: 'p6',
    slug: 'cartaz',
    nome: 'Cartaz',
    categoria: 'impressos',
    arte: 'impresso',
    resumo: 'Cartaz colorido em vários tamanhos.',
    descricao: 'Cartazes em papel couchê para vitrines, eventos e comunicação interna.',
    tipoPreco: 'unidade',
    rotuloVariacao: 'Tamanho',
    variacoes: [
      { id: 'a3', label: 'A3 (29,7 x 42 cm)', preco: 9.9 },
      { id: 'a2', label: 'A2 (42 x 59,4 cm)', preco: 19.9 },
      { id: 'a1', label: 'A1 (59,4 x 84,1 cm)', preco: 39.9 },
    ],
    prazo: '2 a 3 dias úteis',
    precisaArte: true,
  },
  {
    id: 'p7',
    slug: 'placa-pvc-expandido',
    nome: 'Placa em PVC expandido',
    categoria: 'placas',
    arte: 'placa',
    resumo: 'PS e PVC expandido com impressão direta.',
    descricao:
      'Placas de sinalização em PS ou PVC expandido, impressão colorida. Informe a medida desejada.',
    tipoPreco: 'm2',
    rotuloVariacao: 'Material',
    variacoes: [
      { id: 'ps', label: 'PS 1 mm', preco: 130 },
      { id: 'pvc3', label: 'PVC expandido 3 mm', preco: 180 },
      { id: 'pvc5', label: 'PVC expandido 5 mm', preco: 230 },
    ],
    prazo: '3 a 5 dias úteis',
    precisaArte: true,
    destaque: true,
  },
  {
    id: 'p8',
    slug: 'quadro-personalizado',
    nome: 'Quadro decorativo',
    categoria: 'quadros',
    arte: 'quadro',
    resumo: 'Com a sua foto ou arte, moldura e vidro.',
    descricao:
      'Quadros decorativos e personalizados. O valor depende do tamanho e da moldura, então este produto é sob consulta.',
    tipoPreco: 'consulta',
    rotuloVariacao: 'Moldura',
    variacoes: [
      { id: 'preta', label: 'Moldura preta', preco: 0 },
      { id: 'madeira', label: 'Moldura madeira', preco: 0 },
    ],
    prazo: 'Combinado no atendimento',
    precisaArte: true,
  },
]

export const produtoPorSlug = (slug: string) => produtos.find((p) => p.slug === slug)
export const categoriaPorSlug = (slug: string) => categorias.find((c) => c.slug === slug)
