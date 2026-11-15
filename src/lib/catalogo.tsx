import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ArteTipo, Categoria, Produto } from './tipos'
import { erp } from './erp'
import { precoComPromocao, type Promocao } from './promocao'

// Catálogo vem do banco do ERP, SOMENTE pela função pública loja_catalogo()
// (só produtos ativos e marcados "aparece no site"; sem custo, margem ou cliente).

export type Linha = {
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

export type OpcaoQuantidade = { quantidade: number; preco: number; peso_kg?: number | null }

/** Lê as opções vindas do banco, descartando linha inválida e repetida. */
export function opcoesValidas(bruto: unknown): OpcaoQuantidade[] {
  if (!Array.isArray(bruto)) return []
  const vistas = new Set<number>()
  const lista: OpcaoQuantidade[] = []
  for (const o of bruto as any[]) {
    const q = Number(o?.quantidade)
    const preco = Number(o?.preco)
    if (!Number.isInteger(q) || q < 1 || !(preco > 0) || vistas.has(q)) continue
    vistas.add(q)
    lista.push({ quantidade: q, preco, peso_kg: Number(o?.peso_kg) > 0 ? Number(o.peso_kg) : null })
  }
  return lista.sort((a, b) => a.quantidade - b.quantidade)
}

function paraProduto(l: Linha, opcoes: OpcaoQuantidade[] = []): Produto {
  // m² ou sem preço: nunca mostra valor; pedido fechado pelo WhatsApp.
  // Produto com quantidades fechadas tem preço por opção, então não depende do preço único do ERP.
  const temOpcoes = opcoes.length > 0 && !l.por_metro_quadrado
  const sobConsulta = l.por_metro_quadrado || (l.preco === null && !temOpcoes)
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
    tipoPreco: sobConsulta ? 'consulta' : temOpcoes ? 'pacote' : 'unidade',
    temOpcoes,
    variacoes: temOpcoes
      ? opcoes.map((o) => ({
          id: `q${o.quantidade}`,
          label: `${o.quantidade.toLocaleString('pt-BR')} unidades`,
          preco: o.preco,
          quantidade: o.quantidade,
          pesoKg: o.peso_kg ?? undefined,
        }))
      : [{ id: 'unico', label: l.nome, preco: l.preco ?? 0 }],
    rotuloVariacao: temOpcoes ? 'Quantidade' : 'Produto',
    prazo: l.prazo_entrega_dias ? `${l.prazo_entrega_dias} dia(s) úteis` : 'a combinar',
    prazoDias: l.prazo_entrega_dias ? Number(l.prazo_entrega_dias) : undefined,
    precisaArte: !l.derivado_id,
    derivadoId: l.derivado_id ?? undefined,
    arteFixa: !!l.derivado_id,
    destaque: l.destaque,
    maisVendido: l.mais_vendido === true,
  }
}

export type GrupoDb = {
  id: string; slug: string; nome: string; descricao: string | null; imagens: string[]; destaque: boolean; ordem: number
  principal_id: string | null; rotulo_a: string; rotulo_b: string
  itens: { produto_id: string; a: string | null; b: string | null }[]
}

const numeroInicial = (t: string) => {
  const m = t.replace(/\./g, '').match(/\d+/)
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY
}

/** Junta produtos do ERP (um por impressão/quantidade) numa página só. Cada variação é o produto real. */
export function montarGrupo(g: GrupoDb, linhaPorId: Map<string, Linha>, promos: Map<string, Promocao>): Produto | null {
  const membros = g.itens
    .map((it) => ({ it, l: linhaPorId.get(it.produto_id) }))
    .filter((m): m is { it: GrupoDb['itens'][number]; l: Linha } => !!m.l && !m.l.por_metro_quadrado && m.l.preco !== null)
  if (membros.length === 0) return null
  const principal = membros.find((m) => m.l.id === g.principal_id)?.l ?? membros[0].l
  const base = paraProduto(principal)
  const ordemA: string[] = []
  membros.forEach((m) => { const a = (m.it.a ?? '').trim(); if (a && !ordemA.includes(a)) ordemA.push(a) })
  const temA = ordemA.length > 0
  const temB = membros.some((m) => (m.it.b ?? '').trim() !== '')
  const variacoes = membros
    .map((m, idx) => {
      const l = m.l
      const a = (m.it.a ?? '').trim()
      const b = (m.it.b ?? '').trim()
      const de = Number(l.preco)
      const por = precoComPromocao(de, promos.get(l.id))
      return {
        idx, a, b,
        v: {
          id: l.id,
          label: [a, b].filter(Boolean).join(' · ') || l.nome,
          preco: por < de ? por : de,
          precoOriginal: por < de ? de : undefined,
          produtoId: l.id, a, b,
          pesoKg: l.peso_kg ? Number(l.peso_kg) : undefined,
          pacoteCm: l.comprimento_cm && l.largura_cm && l.altura_cm
            ? { comprimento: Number(l.comprimento_cm), largura: Number(l.largura_cm), altura: Number(l.altura_cm) } : undefined,
          soRetirada: l.entrega_modo === 'so_retirada',
          prazo: l.prazo_entrega_dias ? `${l.prazo_entrega_dias} dia(s) úteis` : 'a combinar',
        },
      }
    })
    .sort((x, y) => ordemA.indexOf(x.a) - ordemA.indexOf(y.a) || numeroInicial(x.b) - numeroInicial(y.b) || x.idx - y.idx)
    .map((x) => x.v)
  return {
    ...base,
    id: g.id,
    slug: g.slug,
    nome: g.nome,
    descricao: g.descricao?.trim() ? g.descricao : base.descricao,
    resumo: (g.descricao?.trim() ? g.descricao : base.descricao).split('\n')[0].slice(0, 110),
    imagens: g.imagens?.length ? g.imagens : base.imagens,
    destaque: g.destaque,
    maisVendido: membros.some((m) => m.l.mais_vendido === true),
    tipoPreco: 'pacote',
    temOpcoes: true,
    grupo: { rotuloA: temA ? g.rotulo_a : undefined, rotuloB: temB ? g.rotulo_b : undefined },
    variacoes,
    rotuloVariacao: [temA ? g.rotulo_a : '', temB ? g.rotulo_b : ''].filter(Boolean).join(' e ') || 'Opção',
    entregaModo: variacoes.every((v) => v.soRetirada) ? 'so_retirada' : 'envio_e_retirada',
    pesoKg: undefined,
    pacoteCm: undefined,
    prazo: variacoes[0]?.prazo ?? base.prazo,
    prazoDias: undefined,
    precoOriginal: undefined,
    precisaArte: true,
    arteFixa: false,
    derivadoId: undefined,
  }
}

type LinhaPromo = { produto_id: string; tipo: Promocao['tipo']; valor: number }

/** Aplica a promoção: o preço da variação vira o promocional e o de tabela fica em precoOriginal. */
function comPromocao(p: Produto, promo?: Promocao): Produto {
  if (!promo || p.tipoPreco !== 'unidade' || p.temOpcoes) return p
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
  const [quantidades, setQuantidades] = useState<Map<string, OpcaoQuantidade[]>>(new Map())
  const [grupos, setGrupos] = useState<GrupoDb[]>([])
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
    // Quantidades fechadas também vêm à parte: se falharem, o produto aparece com o preço único
    const opcoesQ = erp
      .rpc('loja_quantidades')
      .then(({ data, error }) =>
        error || !Array.isArray(data)
          ? new Map<string, OpcaoQuantidade[]>()
          : new Map((data as { produto_id: string; opcoes: unknown }[]).map((x) => [x.produto_id, opcoesValidas(x.opcoes)] as const)),
      )
    // Grupos (variações por impressão/quantidade) também vêm à parte: se falharem, os produtos aparecem separados
    const gruposQ = erp.rpc('loja_grupos').then(({ data, error }) => (error || !Array.isArray(data) ? [] : (data as GrupoDb[])))
    Promise.all([erp.rpc('loja_catalogo_v2'), promocoes, opcoesQ, gruposQ]).then(([{ data, error }, mapa, mapaQ, listaG]) => {
      if (error) setErro(true)
      else {
        setPromos(mapa)
        setQuantidades(mapaQ)
        setGrupos(listaG)
        setLinhas((data ?? []) as Linha[])
      }
      setCarregando(false)
    })
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const valor = useMemo<Ctx>(() => {
    // Produtos do ERP que fazem parte de um grupo saem da vitrine; o grupo aparece no lugar do primeiro deles.
    const linhaPorId = new Map(linhas.filter((l) => !l.derivado_id).map((l) => [l.id, l] as const))
    const grupoDoMembro = new Map<string, GrupoDb>()
    grupos.forEach((g) => g.itens.forEach((i) => grupoDoMembro.set(i.produto_id, g)))
    const jaMontado = new Set<string>()
    const entradas: { l: Linha; p: Produto }[] = []
    for (const l of linhas) {
      const g = l.derivado_id ? undefined : grupoDoMembro.get(l.id)
      if (!g) {
        entradas.push({ l, p: comPromocao(paraProduto(l, quantidades.get(l.id)), promos.get(l.id)) })
        continue
      }
      if (jaMontado.has(g.id)) continue
      jaMontado.add(g.id)
      const pg = montarGrupo(g, linhaPorId, promos)
      if (pg) entradas.push({ l, p: pg })
    }
    const produtos = entradas.map((e) => e.p)
    const vistas = new Map<string, Categoria>()
    entradas.forEach(({ l }, i) => {
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
  }, [linhas, promos, quantidades, grupos, carregando, erro, recarregar])

  return <CatalogoCtx.Provider value={valor}>{children}</CatalogoCtx.Provider>
}

export function useCatalogo() {
  const ctx = useContext(CatalogoCtx)
  if (!ctx) throw new Error('useCatalogo precisa estar dentro de CatalogoProvider')
  return ctx
}
