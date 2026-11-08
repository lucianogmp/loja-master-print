import { linkWhatsApp } from '../config'

// Banners do topo da página inicial, editáveis em /admin (aba Banners).
// Arte recomendada: 1600 × 800 px (2:1), assunto importante no centro. Serve para celular e computador.

export type TipoLink = 'nenhum' | 'produto' | 'categoria' | 'oferta' | 'link' | 'whatsapp'
export const TIPOS_LINK: { id: TipoLink; rotulo: string }[] = [
  { id: 'nenhum', rotulo: 'Sem link (só passa)' },
  { id: 'produto', rotulo: 'Produto específico' },
  { id: 'categoria', rotulo: 'Categoria' },
  { id: 'oferta', rotulo: 'Oferta (data comercial)' },
  { id: 'link', rotulo: 'Link livre' },
  { id: 'whatsapp', rotulo: 'WhatsApp' },
]

export type Banner = {
  id: string
  imagem: string
  alt: string
  ativo: boolean
  tipo: TipoLink
  destino: string // produto/categoria/oferta: slug; link: endereço; whatsapp: mensagem (vazio = padrão)
}

export type Banners = {
  ativo: boolean // chave geral: desligada, a página inicial fica como sempre foi
  segundos: number // tempo de cada banner
  itens: Banner[]
}

export const BANNERS_PADRAO: Banners = { ativo: true, segundos: 5, itens: [] }

const SEGUNDOS = [3, 4, 5, 6, 8, 10]
export const OPCOES_SEGUNDOS = SEGUNDOS

const texto = (v: unknown) => (typeof v === 'string' ? v : '')

export function normalizarBanners(v: unknown): Banners {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const itens = (Array.isArray(o.itens) ? o.itens : []).flatMap((x, i): Banner[] => {
    if (!x || typeof x !== 'object') return []
    const b = x as Record<string, unknown>
    const tipo = TIPOS_LINK.some((t) => t.id === b.tipo) ? (b.tipo as TipoLink) : 'nenhum'
    return [
      {
        id: texto(b.id) || `b${i}`,
        imagem: texto(b.imagem),
        alt: texto(b.alt),
        ativo: b.ativo !== false,
        tipo,
        destino: texto(b.destino),
      },
    ]
  })
  const seg = Number(o.segundos)
  return { ativo: o.ativo !== false, segundos: SEGUNDOS.includes(seg) ? seg : BANNERS_PADRAO.segundos, itens }
}

/** Banners que realmente aparecem: chave geral ligada, banner ligado e com imagem. */
export function bannersVisiveis(b: Banners): Banner[] {
  return b.ativo ? b.itens.filter((x) => x.ativo && x.imagem) : []
}

export type Destino = { interno: string } | { externo: string } | null

/** Para onde o clique leva. null = banner sem link (ou link inválido). */
export function destinoDoBanner(b: Pick<Banner, 'tipo' | 'destino'>, temWhatsApp = true): Destino {
  const d = b.destino.trim()
  switch (b.tipo) {
    case 'produto':
      return d ? { interno: `/produto/${encodeURIComponent(d)}` } : null
    case 'categoria':
      return d ? { interno: `/produtos?categoria=${encodeURIComponent(d)}` } : null
    case 'oferta':
      return d ? { interno: `/oferta/${encodeURIComponent(d)}` } : null
    case 'link':
      if (d.startsWith('/') && !d.startsWith('//')) return { interno: d }
      return /^https?:\/\//i.test(d) ? { externo: d } : null
    case 'whatsapp':
      return temWhatsApp ? { externo: linkWhatsApp(d || undefined) } : null
    default:
      return null
  }
}
