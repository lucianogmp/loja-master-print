import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { erp } from './erp'
import { LOJA } from '../config'
import { BANNERS_PADRAO, normalizarBanners, type Banners } from './banners'

// Textos e ordem do site, editáveis em /admin. Vêm do banco do ERP pela função pública loja_config().
// Se algo faltar ou o banco não responder, valem os padrões abaixo (o site nunca fica em branco).

export type Empresa = {
  nome: string
  slogan: string
  whatsapp: string // só números, com DDI (ex.: 5533998139539)
  horario: string
  mensagemWhatsApp: string
  email: string
  endereco: string
  instagram: string
  facebook: string
  textoRodape: string
}

export type Aparencia = {
  logo: string // logo de cor clara, para fundo escuro; vazio = logo padrão (ícone + nome)
  logoEscuro: string // logo de cor escura, para fundo claro; vazio = usa o outro
  favicon: string // vazio = ícone padrão
  iconeApp: string // ícone do aplicativo instalado (PNG quadrado, 512 px); vazio = padrão
  cor: string // cor principal em #rrggbb; vazio = azul padrão
  tituloAba: string // título da aba do navegador
}

export type Pagina = { slug: string; titulo: string; conteudo: string; no_rodape: boolean; ordem: number }

export type SecaoId = 'destaques' | 'ofertas' | 'beneficios' | 'mais_vendidos' | 'produtos'
export type Secao = { id: SecaoId; titulo: string; visivel: boolean }
export type Beneficio = { titulo: string; texto: string }

export type Inicio = {
  selo: string
  titulo: string // parte normal do título
  tituloDestaque: string // parte colorida
  texto: string
  botaoPrincipal: string
  botaoWhatsApp: string
  imagem: string // vazio = desenho padrão
  beneficios: Beneficio[]
  secoes: Secao[]
}

export const EMPRESA_PADRAO: Empresa = {
  nome: 'Master Print',
  slogan: 'Sua gráfica online',
  whatsapp: '5533998139539',
  horario: 'Seg a Sex, 8h às 18h',
  mensagemWhatsApp: 'Olá! Vim pelo site da Master Print.',
  email: '',
  endereco: '',
  instagram: '',
  facebook: '',
  textoRodape: 'Impressos e comunicação visual com atendimento de verdade.',
}

export const INICIO_PADRAO: Inicio = {
  selo: 'Gráfica online',
  titulo: 'Ideias boas merecem',
  tituloDestaque: 'uma boa impressão.',
  texto: 'Materiais gráficos e personalizados para sua marca, seu negócio e seus momentos especiais. Peça pelo site ou pelo WhatsApp',
  botaoPrincipal: 'Ver produtos',
  botaoWhatsApp: 'Falar no WhatsApp',
  imagem: '',
  beneficios: [
    { titulo: 'Atendimento humano', texto: 'Tire dúvidas e acerte detalhes pelo WhatsApp.' },
    { titulo: 'Retirada ou entrega', texto: 'Combine a melhor forma de receber seu pedido.' },
    { titulo: 'Ajuda com a arte', texto: 'Não tem arte pronta? A gente te ajuda.' },
  ],
  secoes: [
    { id: 'destaques', titulo: 'Destaques', visivel: true },
    { id: 'ofertas', titulo: 'Ofertas', visivel: true },
    { id: 'beneficios', titulo: 'Vantagens', visivel: true },
    { id: 'mais_vendidos', titulo: 'Mais vendidos', visivel: true },
    { id: 'produtos', titulo: 'Produtos', visivel: true },
  ],
}

export const APARENCIA_PADRAO: Aparencia = {
  logo: '',
  logoEscuro: '',
  favicon: '',
  iconeApp: '',
  cor: '',
  tituloAba: 'Master Print — Gráfica online',
}

const texto = (v: unknown, padrao: string) => (typeof v === 'string' ? v : padrao)

export function normalizarEmpresa(v: unknown): Empresa {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const r = { ...EMPRESA_PADRAO }
  ;(Object.keys(r) as (keyof Empresa)[]).forEach((k) => {
    r[k] = texto(o[k], r[k])
  })
  // Número vazio na configuração = sem WhatsApp (some o botão e os links); só a chave ausente usa o padrão
  r.whatsapp = r.whatsapp.replace(/\D/g, '')
  return r
}

export function normalizarInicio(v: unknown): Inicio {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const p = INICIO_PADRAO
  const bens = Array.isArray(o.beneficios) ? (o.beneficios as Partial<Beneficio>[]) : []
  const beneficios = p.beneficios.map((b, i) => ({
    titulo: texto(bens[i]?.titulo, b.titulo),
    texto: texto(bens[i]?.texto, b.texto),
  }))
  // Mantém a ordem salva e garante que todas as seções existam
  const salvas = Array.isArray(o.secoes) ? (o.secoes as Partial<Secao>[]) : []
  const secoes: Secao[] = []
  salvas.forEach((s) => {
    const base = p.secoes.find((x) => x.id === s?.id)
    if (base && !secoes.some((x) => x.id === base.id))
      secoes.push({ id: base.id, titulo: texto(s.titulo, base.titulo), visivel: s.visivel !== false })
  })
  // Seções novas: Destaques e Ofertas entram no começo (é o que o visitante deve ver logo); as demais, no fim
  const novas = p.secoes.filter((b) => !secoes.some((x) => x.id === b.id))
  const noTopo = novas.filter((b) => b.id === 'destaques' || b.id === 'ofertas')
  secoes.unshift(...noTopo.map((b) => ({ ...b })))
  novas.filter((b) => !noTopo.includes(b)).forEach((b) => secoes.push({ ...b }))
  return {
    selo: texto(o.selo, p.selo),
    titulo: texto(o.titulo, p.titulo),
    tituloDestaque: texto(o.tituloDestaque, p.tituloDestaque),
    texto: texto(o.texto, p.texto),
    botaoPrincipal: texto(o.botaoPrincipal, p.botaoPrincipal),
    botaoWhatsApp: texto(o.botaoWhatsApp, p.botaoWhatsApp),
    imagem: texto(o.imagem, p.imagem),
    beneficios,
    secoes,
  }
}

export function normalizarAparencia(v: unknown): Aparencia {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const p = APARENCIA_PADRAO
  const cor = texto(o.cor, '').trim()
  return {
    logo: texto(o.logo, p.logo),
    logoEscuro: texto(o.logoEscuro, p.logoEscuro),
    favicon: texto(o.favicon, p.favicon),
    iconeApp: texto(o.iconeApp, p.iconeApp),
    cor: /^#[0-9a-f]{6}$/i.test(cor) ? cor.toLowerCase() : '',
    tituloAba: texto(o.tituloAba, p.tituloAba).trim() || p.tituloAba,
  }
}

const rgbDe = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]
const misturar = (hex: string, alvo: number, f: number) => {
  const [r, g, b] = rgbDe(hex).map((c) => Math.round(c + (alvo - c) * f))
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
/** Brilho de 0 (preto) a 1 (branco). Cores muito claras deixam o texto branco dos botões ilegível. */
export function brilho(hex: string) {
  const [r, g, b] = rgbDe(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Contraste WCAG entre duas cores #rrggbb (1 a 21). */
export function contraste(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b2] = rgbDe(hex).map((c) => {
      const s = c / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/** Escurece (alvo 0) ou clareia (alvo 255) a cor até ela ter 4,5:1 sobre o fundo. */
function legivelSobre(hex: string, fundo: string, alvo: 0 | 255) {
  let cor = hex
  for (let f = 0.05; contraste(cor, fundo) < 4.5 && f <= 1; f += 0.05) cor = misturar(hex, alvo, f)
  return cor
}

// Fundos mais escuros (tema claro) e mais claros (tema escuro) onde links e abas ativas aparecem.
const FUNDO_CLARO_MAIS_ESCURO = '#e8edf5'
const FUNDO_ESCURO_MAIS_CLARO = '#1a2332'
const TEXTO_ESCURO = '#0f172a'

const CHAVE_CACHE = 'loja-aparencia'

export function aplicarAparencia(a: Aparencia) {
  const raiz = document.documentElement
  const vars = ['--cor-1', '--cor-2', '--cor-3', '--cor-4', '--cor-rgb', '--cor-rgb-2', '--cor-texto', '--cor-link-claro', '--cor-link-escuro']
  if (a.cor) {
    const c = a.cor
    const c2 = misturar(c, 0, 0.3)
    const c3 = misturar(c, 255, 0.3)
    const c4 = misturar(c, 0, 0.15)
    raiz.style.setProperty('--cor-1', c)
    raiz.style.setProperty('--cor-2', c2)
    raiz.style.setProperty('--cor-3', c3)
    raiz.style.setProperty('--cor-4', c4)
    raiz.style.setProperty('--cor-rgb', rgbDe(c).join(', '))
    raiz.style.setProperty('--cor-rgb-2', rgbDe(c4).join(', '))
    // O degradê ativo vai de --cor-4 a --cor-2: o texto é branco só se passar 4,5:1 na ponta mais clara.
    raiz.style.setProperty('--cor-texto', contraste('#ffffff', c4) >= 4.5 ? '#ffffff' : TEXTO_ESCURO)
    raiz.style.setProperty('--cor-link-claro', legivelSobre(c2, FUNDO_CLARO_MAIS_ESCURO, 0))
    raiz.style.setProperty('--cor-link-escuro', legivelSobre(c3, FUNDO_ESCURO_MAIS_CLARO, 255))
  } else {
    vars.forEach((v) => raiz.style.removeProperty(v))
  }
  document.title = a.tituloAba
  const icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icone) {
    icone.href = a.favicon || '/favicon.svg'
    icone.type = a.favicon ? '' : 'image/svg+xml'
  }
  // Ícone usado ao adicionar à tela inicial (iPhone) — no Android/Chrome vale o manifesto
  let toque = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (!toque) {
    toque = document.createElement('link')
    toque.rel = 'apple-touch-icon'
    document.head.appendChild(toque)
  }
  toque.href = a.iconeApp || '/icones/icone-180.png'
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(a))
  } catch {
    // sem armazenamento: só não evita o piscar da cor na próxima visita
  }
}

function aparenciaInicial(): Aparencia {
  try {
    const c = localStorage.getItem(CHAVE_CACHE)
    if (c) return normalizarAparencia(JSON.parse(c))
  } catch {
    // ignora
  }
  return APARENCIA_PADRAO
}

type Ctx = { empresa: Empresa; inicio: Inicio; banners: Banners; aparencia: Aparencia; paginas: Pagina[]; paginasCarregadas: boolean; recarregar: () => Promise<void> }
const SiteCtx = createContext<Ctx | null>(null)

function aplicarEmpresa(e: Empresa) {
  // Mantém o objeto LOJA (usado por linkWhatsApp) sempre igual à configuração
  LOJA.nome = e.nome
  LOJA.slogan = e.slogan
  LOJA.whatsapp = e.whatsapp
  LOJA.horario = e.horario
  LOJA.mensagem = e.mensagemWhatsApp
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa>(EMPRESA_PADRAO)
  const [inicio, setInicio] = useState<Inicio>(INICIO_PADRAO)
  const [banners, setBanners] = useState<Banners>(BANNERS_PADRAO)
  const [aparencia, setAparencia] = useState<Aparencia>(aparenciaInicial)
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [paginasCarregadas, setPaginasCarregadas] = useState(false)

  const recarregar = useCallback(async () => {
    erp.rpc('loja_paginas').then(({ data, error }) => {
      if (!error && Array.isArray(data)) setPaginas(data as Pagina[])
      setPaginasCarregadas(true)
    })
    const { data, error } = await erp.rpc('loja_config')
    if (error || !data) return
    const e = normalizarEmpresa((data as Record<string, unknown>).empresa)
    aplicarEmpresa(e)
    setEmpresa(e)
    setInicio(normalizarInicio((data as Record<string, unknown>).inicio))
    setBanners(normalizarBanners((data as Record<string, unknown>).banners))
    const a = normalizarAparencia((data as Record<string, unknown>).aparencia)
    aplicarAparencia(a)
    setAparencia(a)
  }, [])

  // Aplica já a última aparência conhecida (evita piscar a cor padrão), depois atualiza do banco
  useEffect(() => {
    aplicarAparencia(aparencia)
    recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarregar])

  const valor = useMemo(
    () => ({ empresa, inicio, banners, aparencia, paginas, paginasCarregadas, recarregar }),
    [empresa, inicio, banners, aparencia, paginas, paginasCarregadas, recarregar],
  )
  return <SiteCtx.Provider value={valor}>{children}</SiteCtx.Provider>
}

export function useSite() {
  const c = useContext(SiteCtx)
  if (!c) throw new Error('useSite fora do SiteProvider')
  return c
}
