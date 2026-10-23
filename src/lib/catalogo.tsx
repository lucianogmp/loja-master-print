import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ArteTipo, Categoria, Grupo, Produto } from './tipos'
import { erp } from './erp'

// Catálogo vem do banco do ERP, SOMENTE pela função pública loja_catalogo()
// (só produtos ativos e marcados "aparece no site"; sem custo, margem ou cliente).

type Linha = {
  id: string
  slug: string
  nome: string
  categoria: string | null
  por_metro_quadrado: boolean
  preco: number | null
  prazo_entrega_dias: number | null
  descricao_publica: string | null
  imagens: string[]
  medidas: string | null
  info_envio: string | null
  destaque: boolean
  ordem: number
  grupo_slug: string | null
  grupo_nome: string | null
  grupo_ordem: number | null
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function arteDe(texto: string): ArteTipo {
  const t = slugify(texto)
  if (t.includes('cart')) return 'cartao'
  if (t.includes('adesiv') || t.includes('vinil')) return 'adesivo'
  if (t.includes('banner') || t.includes('lona') || t.includes('faixa')) return 'banner'
  if (t.includes('placa') || t.includes('metalon') || t.includes('acm')) return 'placa'
  if (t.includes('quadro')) return 'quadro'
  return 'impresso'
}

function paraProduto(l: Linha): Produto {
  // m² ou sem preço: nunca mostra valor; pedido fechado pelo WhatsApp.
  const sobConsulta = l.por_metro_quadrado || l.preco === null
  const categoria = l.categoria ? slugify(l.categoria) : 'outros'
  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    categoria,
    grupo: l.grupo_slug ?? categoria, // categoria sem grupo vira seu próprio grupo
    arte: arteDe(`${l.categoria ?? ''} ${l.nome}`),
    resumo: l.descricao_publica?.split('\n')[0].slice(0, 110) ?? '',
    descricao: l.descricao_publica ?? '',
    imagens: l.imagens ?? [],
    medidas: l.medidas ?? undefined,
    infoEnvio: l.info_envio ?? undefined,
    tipoPreco: sobConsulta ? 'consulta' : 'unidade',
    variacoes: [{ id: 'unico', label: l.nome, preco: l.preco ?? 0 }],
    rotuloVariacao: 'Produto',
    prazo: l.prazo_entrega_dias ? `${l.prazo_entrega_dias} dia(s) úteis` : 'a combinar',
    precisaArte: true,
    destaque: l.destaque,
  }
}

type Ctx = {
  produtos: Produto[]
  categorias: Categoria[]
  grupos: Grupo[]
  carregando: boolean
  erro: boolean
  produtoPorSlug: (slug: string) => Produto | undefined
  categoriaPorSlug: (slug: string) => Categoria | undefined
}
const CatalogoCtx = createContext<Ctx | null>(null)

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    erp.rpc('loja_catalogo').then(({ data, error }) => {
      if (error) setErro(true)
      else setLinhas((data ?? []) as Linha[])
      setCarregando(false)
    })
  }, [])

  const valor = useMemo<Ctx>(() => {
    const produtos = linhas.map(paraProduto)
    const vistas = new Map<string, Categoria>()
    linhas.forEach((l, i) => {
      const c = produtos[i].categoria
      if (!vistas.has(c)) vistas.set(c, { slug: c, nome: l.categoria ?? 'Outros', arte: produtos[i].arte, grupo: produtos[i].grupo })
    })
    linhas.forEach((l, i) => {
      const c = vistas.get(produtos[i].categoria)
      if (c) c.grupo = produtos[i].grupo
    })
    const categorias = [...vistas.values()]
    const gv = new Map<string, Grupo>()
    linhas.forEach((l, i) => {
      const g = produtos[i].grupo
      if (!gv.has(g)) gv.set(g, { slug: g, nome: l.grupo_nome ?? l.categoria ?? 'Outros', arte: produtos[i].arte, ordem: l.grupo_ordem ?? 9999 })
    })
    const grupos = [...gv.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome))
    return {
      produtos,
      categorias,
      grupos,
      carregando,
      erro,
      produtoPorSlug: (slug) => produtos.find((p) => p.slug === slug),
      categoriaPorSlug: (slug) => categorias.find((c) => c.slug === slug),
    }
  }, [linhas, carregando, erro])

  return <CatalogoCtx.Provider value={valor}>{children}</CatalogoCtx.Provider>
}

export function useCatalogo() {
  const ctx = useContext(CatalogoCtx)
  if (!ctx) throw new Error('useCatalogo precisa estar dentro de CatalogoProvider')
  return ctx
}
