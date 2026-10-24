import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ArteTipo, Categoria, Produto } from './tipos'
import { erp } from './erp'

// Catálogo vem do banco do ERP, SOMENTE pela função pública loja_catalogo()
// (só produtos ativos e marcados "aparece no site"; sem custo, margem ou cliente).

type Linha = {
  id: string
  slug: string
  nome: string
  categoria: string | null // nome público (editável na administração)
  categoria_original: string | null // nome no ERP (base do endereço, não muda)
  categoria_imagem: string | null
  categoria_ordem: number
  por_metro_quadrado: boolean
  preco: number | null
  prazo_entrega_dias: number | null
  descricao_publica: string | null
  imagens: string[]
  peso_kg: number | null
  comprimento_cm: number | null
  largura_cm: number | null
  altura_cm: number | null
  entrega_modo: 'envio_e_retirada' | 'so_retirada'
  destaque: boolean
  ordem: number
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
  const categoria = l.categoria_original ? slugify(l.categoria_original) : 'outros'
  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    categoria,
    arte: arteDe(`${l.categoria_original ?? ''} ${l.nome}`),
    resumo: l.descricao_publica?.split('\n')[0].slice(0, 110) ?? '',
    descricao: l.descricao_publica ?? '',
    imagens: l.imagens ?? [],
    pesoKg: l.peso_kg ? Number(l.peso_kg) : undefined,
    pacoteCm:
      l.comprimento_cm && l.largura_cm && l.altura_cm
        ? { comprimento: Number(l.comprimento_cm), largura: Number(l.largura_cm), altura: Number(l.altura_cm) }
        : undefined,
    entregaModo: l.entrega_modo ?? 'envio_e_retirada',
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
      if (!vistas.has(c))
        vistas.set(c, {
          slug: c,
          nome: l.categoria ?? 'Outros',
          arte: produtos[i].arte,
          imagem: l.categoria_imagem ?? undefined,
          ordem: l.categoria_ordem ?? 0,
        })
    })
    const categorias = [...vistas.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome))
    return {
      produtos,
      categorias,
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
