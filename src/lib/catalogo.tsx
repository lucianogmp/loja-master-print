import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ArteTipo, Categoria, Produto } from './tipos'
import { erp } from './erp'
import { precoComPromocao, type Promocao } from './promocao'

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
  mais_vendido?: boolean
  derivado_id?: string | null
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
    prazoDias: l.prazo_entrega_dias ? Number(l.prazo_entrega_dias) : undefined,
    precisaArte: !l.derivado_id,
    derivadoId: l.derivado_id ?? undefined,
    arteFixa: !!l.derivado_id,
    destaque: l.destaque,
    maisVendido: l.mais_vendido === true,
  }
}

type LinhaPromo = { produto_id: string; tipo: Promocao['tipo']; valor: number }

/** Aplica a promoção: o preço da variação vira o promocional e o de tabela fica em precoOriginal. */
function comPromocao(p: Produto, promo?: Promocao): Produto {
  if (!promo || p.tipoPreco !== 'unidade') return p
  const de = p.variacoes[0]?.preco ?? 0
  const por = precoComPromocao(de, promo)
  if (por >= de) return p
  return { ...p, precoOriginal: de, variacoes: p.variacoes.map((v) => ({ ...v, preco: por })) }
}

type Ctx = {
  produtos: Produto[]
  categorias: Categoria[]
  carregando: boolean
  erro: boolean
  recarregar: () => void
  produtoPorSlug: (slug: string) => Produto | undefined
  categoriaPorSlug: (slug: string) => Categoria | undefined
}
const CatalogoCtx = createContext<Ctx | null>(null)

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [promos, setPromos] = useState<Map<string, Promocao>>(new Map())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const recarregar = useCallback(() => {
    setErro(false)
    setCarregando(true)
    // Promoções vêm à parte: se falharem, o catálogo aparece com os preços normais
    const promocoes = erp
      .rpc('loja_promocoes')
      .then(({ data, error }) =>
        error || !Array.isArray(data)
          ? new Map<string, Promocao>()
          : new Map((data as LinhaPromo[]).map((x) => [x.produto_id, { tipo: x.tipo, valor: Number(x.valor) }] as const)),
      )
    Promise.all([erp.rpc('loja_catalogo_v2'), promocoes]).then(([{ data, error }, mapa]) => {
      if (error) setErro(true)
      else {
        setPromos(mapa)
        setLinhas((data ?? []) as Linha[])
      }
      setCarregando(false)
    })
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const valor = useMemo<Ctx>(() => {
    const produtos = linhas.map((l) => comPromocao(paraProduto(l), promos.get(l.id)))
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
      recarregar,
      produtoPorSlug: (slug) => produtos.find((p) => p.slug === slug),
      categoriaPorSlug: (slug) => categorias.find((c) => c.slug === slug),
    }
  }, [linhas, promos, carregando, erro, recarregar])

  return <CatalogoCtx.Provider value={valor}>{children}</CatalogoCtx.Provider>
}

export function useCatalogo() {
  const ctx = useContext(CatalogoCtx)
  if (!ctx) throw new Error('useCatalogo precisa estar dentro de CatalogoProvider')
  return ctx
}
