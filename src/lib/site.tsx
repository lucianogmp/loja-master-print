import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { erp } from './erp'
import { LOJA } from '../config'

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
  logo: string // vazio = logo padrão
  favicon: string // vazio = ícone padrão
  cor: string // cor principal em #rrggbb; vazio = azul padrão
  tituloAba: string // título da aba do navegador
}

export type SecaoId = 'beneficios' | 'mais_vendidos' | 'produtos'
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
  botaoWhatsApp: 'Falar com a gráfica',
  imagem: '',
  beneficios: [
    { titulo: 'Atendimento humano', texto: 'Tire dúvidas e acerte detalhes pelo WhatsApp.' },
    { titulo: 'Retirada ou entrega', texto: 'Combine a melhor forma de receber seu pedido.' },
    { titulo: 'Ajuda com a arte', texto: 'Não tem arte pronta? A gente te ajuda.' },
  ],
  secoes: [
    { id: 'beneficios', titulo: 'Vantagens', visivel: true },
    { id: 'mais_vendidos', titulo: 'Mais vendidos', visivel: true },
    { id: 'produtos', titulo: 'Produtos', visivel: true },
  ],
}

export const APARENCIA_PADRAO: Aparencia = {
  logo: '',
  favicon: '',
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
  r.whatsapp = r.whatsapp.replace(/\D/g, '') || EMPRESA_PADRAO.whatsapp
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
  p.secoes.forEach((b) => {
    if (!secoes.some((x) => x.id === b.id)) secoes.push({ ...b })
  })
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
    favicon: texto(o.favicon, p.favicon),
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

const CHAVE_CACHE = 'loja-aparencia'

export function aplicarAparencia(a: Aparencia) {
  const raiz = document.documentElement
  const vars = ['--cor-1', '--cor-2', '--cor-3', '--cor-4', '--cor-rgb', '--cor-rgb-2']
  if (a.cor) {
    const c = a.cor
    raiz.style.setProperty('--cor-1', c)
    raiz.style.setProperty('--cor-2', misturar(c, 0, 0.3))
    raiz.style.setProperty('--cor-3', misturar(c, 255, 0.3))
    raiz.style.setProperty('--cor-4', misturar(c, 0, 0.15))
    raiz.style.setProperty('--cor-rgb', rgbDe(c).join(', '))
    raiz.style.setProperty('--cor-rgb-2', rgbDe(misturar(c, 0, 0.15)).join(', '))
  } else {
    vars.forEach((v) => raiz.style.removeProperty(v))
  }
  document.title = a.tituloAba
  const icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icone) {
    icone.href = a.favicon || '/favicon.svg'
    icone.type = a.favicon ? '' : 'image/svg+xml'
  }
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

type Ctx = { empresa: Empresa; inicio: Inicio; aparencia: Aparencia; recarregar: () => Promise<void> }
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
  const [aparencia, setAparencia] = useState<Aparencia>(aparenciaInicial)

  const recarregar = useCallback(async () => {
    const { data, error } = await erp.rpc('loja_config')
    if (error || !data) return
    const e = normalizarEmpresa((data as Record<string, unknown>).empresa)
    aplicarEmpresa(e)
    setEmpresa(e)
    setInicio(normalizarInicio((data as Record<string, unknown>).inicio))
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

  const valor = useMemo(() => ({ empresa, inicio, aparencia, recarregar }), [empresa, inicio, aparencia, recarregar])
  return <SiteCtx.Provider value={valor}>{children}</SiteCtx.Provider>
}

export function useSite() {
  const c = useContext(SiteCtx)
  if (!c) throw new Error('useSite fora do SiteProvider')
  return c
}
