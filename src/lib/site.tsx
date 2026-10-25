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

type Ctx = { empresa: Empresa; inicio: Inicio; recarregar: () => Promise<void> }
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

  const recarregar = useCallback(async () => {
    const { data, error } = await erp.rpc('loja_config')
    if (error || !data) return
    const e = normalizarEmpresa((data as Record<string, unknown>).empresa)
    aplicarEmpresa(e)
    setEmpresa(e)
    setInicio(normalizarInicio((data as Record<string, unknown>).inicio))
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const valor = useMemo(() => ({ empresa, inicio, recarregar }), [empresa, inicio, recarregar])
  return <SiteCtx.Provider value={valor}>{children}</SiteCtx.Provider>
}

export function useSite() {
  const c = useContext(SiteCtx)
  if (!c) throw new Error('useSite fora do SiteProvider')
  return c
}
