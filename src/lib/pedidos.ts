import { useCallback, useEffect, useRef, useState } from 'react'
import { ERP_URL } from './erp'
import { MSG_SEM_CONEXAO, useAuth } from './auth'
import { brl } from './format'
import { gravarJson, lerJson, removerChaves } from './armazenamento'

export type PedidoItem = { descricao: string; quantidade: number; preco_unitario: number; total: number }
export type Pedido = {
  numero: number
  data: string
  total: number
  desconto?: number // R$ de promoção do site já abatidos do total
  etapa: number // 0 cancelado · 1 recebido · 2 em produção · 3 pronto · 4 entregue
  situacao: string
  recebimento: string
  endereco: string
  itens: PedidoItem[]
}

export const ETAPAS = ['Recebido', 'Em produção', 'Pronto', 'Entregue']

const PREFIXO_CACHE = 'loja-pedidos:'
const VERSAO_CACHE = 1
const MSG_FALHA = 'Não foi possível carregar seus pedidos.'
// Voltar a uma tela de pedidos logo depois de buscar não repete a busca (ex.: lista → detalhe)
const JANELA_FRESCA_MS = 15_000

export class ErroPedidos extends Error {
  codigo: 'sessao' | 'rede' | 'servidor'
  constructor(codigo: 'sessao' | 'rede' | 'servidor', msg: string) {
    super(msg)
    this.name = 'ErroPedidos'
    this.codigo = codigo
  }
}

/** Histórico de pedidos do comprador logado (vem do ERP por uma função que só entrega os pedidos dele). */
export async function buscarPedidos(token: string): Promise<Pedido[]> {
  let r: Response
  try {
    r = await fetch(`${ERP_URL}/functions/v1/loja-meus-pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-comprador-token': token },
      body: '{}',
    })
  } catch {
    throw new ErroPedidos('rede', MSG_SEM_CONEXAO)
  }
  if (r.status === 401 || r.status === 403) throw new ErroPedidos('sessao', 'Sua sessão expirou.')
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErroPedidos('servidor', j.erro ?? MSG_FALHA)
  if (!Array.isArray(j.pedidos)) throw new ErroPedidos('servidor', MSG_FALHA)
  return j.pedidos as Pedido[]
}

// ---------- Ordem e apresentação ----------

/** Mais novos primeiro; na mesma data, o número maior vem antes. */
function ordenar(lista: Pedido[]): Pedido[] {
  const quando = (p: Pedido) => Date.parse(p.data) || 0
  return [...lista].sort((a, b) => quando(b) - quando(a) || b.numero - a.numero)
}

export function etapaInfo(etapa: unknown, situacao: string): { rotulo: string; indice: number | null; cancelado: boolean; nota: string | null } {
  const texto = typeof situacao === 'string' ? situacao.trim() : ''
  if (etapa === 0) return { cancelado: true, rotulo: 'Cancelado', indice: null, nota: texto || null }
  if (typeof etapa === 'number' && Number.isInteger(etapa) && etapa >= 1 && etapa <= ETAPAS.length) {
    const rotulo = ETAPAS[etapa - 1]
    return { cancelado: false, rotulo, indice: etapa - 1, nota: texto && texto.toLowerCase() !== rotulo.toLowerCase() ? texto : null }
  }
  return { cancelado: false, rotulo: texto || 'Em andamento', indice: null, nota: null }
}

/** Classe do chip: `etapa-1..4`, `cancelado` ou `neutro`. */
export function classeEtapa(p: Pick<Pedido, 'etapa' | 'situacao'>): string {
  const info = etapaInfo(p.etapa, p.situacao)
  return info.cancelado ? 'cancelado' : info.indice === null ? 'neutro' : `etapa-${info.indice + 1}`
}

/** dd/mm/aaaa no horário de Brasília (não muda de dia conforme o fuso do aparelho). */
export function dataPedido(iso: string): string {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? '—' : new Date(t).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function resumoItens(p: Pedido): string {
  const n = p.itens?.length ?? 0
  if (n === 0) return 'Sem itens'
  if (n === 1) return `1 item · ${p.itens[0].descricao}`
  return `${n} itens · ${p.itens[0].descricao} e mais ${n - 1}`
}

export function totalFormatado(total: unknown): string {
  return typeof total === 'number' && Number.isFinite(total) ? brl(total) : '—'
}

export function mensagemWhatsAppPedido(numero: number): string {
  return `Olá! Quero falar sobre o pedido nº ${numero}.`
}

// ---------- Cache por comprador (localStorage) ----------

type CacheSalvo = { userId: string; salvoEm: string; pedidos: Pedido[] }

const chaveCache = (userId: string) => PREFIXO_CACHE + userId

function lerCache(userId: string): Pedido[] | null {
  const salvo = lerJson<CacheSalvo>(chaveCache(userId), VERSAO_CACHE)
  if (!salvo || salvo.userId !== userId || !Array.isArray(salvo.pedidos)) return null
  return salvo.pedidos
}

// Estado do módulo: uma busca por vez, e `geracao` muda quando o cache é limpo (sair, sessão vencida,
// pedido novo) para uma resposta atrasada não gravar nem aparecer para quem já saiu.
let geracao = 0
let emAndamento: { userId: string; promessa: Promise<Pedido[] | null> } | null = null
let ultimaBusca: { userId: string; em: number } | null = null

/** Apaga o cache de um comprador (ou de todos, sem argumento) e descarta buscas em andamento. */
export function limparCachePedidos(userId?: string): void {
  geracao++
  emAndamento = null
  ultimaBusca = null
  if (userId) {
    try {
      localStorage.removeItem(chaveCache(userId))
    } catch {
      // sem armazenamento: nada a remover
    }
  } else {
    removerChaves(PREFIXO_CACHE)
  }
}

/** Busca no ERP, confere e grava no cache. `null` = a resposta foi descartada (o cache foi limpo no meio). */
function buscarECachear(userId: string, token: string): Promise<Pedido[] | null> {
  if (emAndamento?.userId === userId) return emAndamento.promessa
  const minha = geracao
  const promessa = (async () => {
    try {
      const recebidos = await buscarPedidos(token)
      if (geracao !== minha) return null
      // Lista vazia por cima de uma lista que já tinha pedidos não é confiável: conta como falha
      if (recebidos.length === 0 && (lerCache(userId)?.length ?? 0) > 0) throw new ErroPedidos('servidor', MSG_FALHA)
      const ordenados = ordenar(recebidos)
      gravarJson(chaveCache(userId), VERSAO_CACHE, { userId, salvoEm: new Date().toISOString(), pedidos: ordenados })
      ultimaBusca = { userId, em: Date.now() }
      return ordenados
    } catch (e) {
      if (geracao !== minha) return null
      if (e instanceof ErroPedidos) console.warn('[pedidos]', e.codigo, e.message)
      throw e
    } finally {
      if (emAndamento?.userId === userId && geracao === minha) emAndamento = null
    }
  })()
  emAndamento = { userId, promessa }
  return promessa
}

// ---------- Hook ----------

export type EstadoPedidos = {
  pedidos: Pedido[]
  carregando: boolean // primeira carga, sem nada para mostrar
  atualizando: boolean // atualização em segundo plano (a lista em cache continua na tela)
  erro: string | null // primeira carga falhou e não há cache
  erroAtualizacao: boolean // a atualização falhou e o cache foi mantido
  sessaoExpirada: boolean
  recarregar: () => Promise<void>
}

type Interno = EstadoPedidos & { temDados: boolean }

function estadoInicial(userId: string | undefined): Interno {
  const cache = userId ? lerCache(userId) : null
  const fresco = !!userId && ultimaBusca?.userId === userId && Date.now() - ultimaBusca.em < JANELA_FRESCA_MS
  return {
    pedidos: cache ? ordenar(cache) : [],
    carregando: !!userId && !cache,
    atualizando: !!cache && !fresco,
    erro: null,
    erroAtualizacao: false,
    sessaoExpirada: false,
    temDados: !!cache,
    recarregar: async () => {},
  }
}

export function usePedidos(): EstadoPedidos {
  const { session, marcarSessaoExpirada } = useAuth()
  const userId = session?.user.id
  const [estado, setEstado] = useState<Interno>(() => estadoInicial(userId))
  const ativo = useRef({ userId, token: session?.access_token, expirar: marcarSessaoExpirada })
  ativo.current = { userId, token: session?.access_token, expirar: marcarSessaoExpirada }
  const noAr = useRef<Promise<void> | null>(null)
  const temDados = useRef(estado.temDados)
  temDados.current = estado.temDados

  const executar = useCallback((): Promise<void> => {
    const { userId: uid, token } = ativo.current
    if (!uid || !token) return Promise.resolve()
    if (noAr.current) return noAr.current
    // o erro anterior fica na tela até a nova resposta (o botão Tentar de novo só desliga)
    setEstado((e) => (e.temDados ? { ...e, atualizando: true, erroAtualizacao: false } : { ...e, carregando: true }))
    const p = buscarECachear(uid, token)
      .then((lista) => {
        if (lista === null || ativo.current.userId !== uid) return
        setEstado((e) => ({ ...e, pedidos: lista, carregando: false, atualizando: false, erro: null, erroAtualizacao: false, temDados: true }))
      })
      .catch(async (e: unknown) => {
        if (ativo.current.userId !== uid) return
        const codigo = e instanceof ErroPedidos ? e.codigo : 'servidor'
        if (codigo === 'sessao') {
          limparCachePedidos(uid)
          setEstado((s) => ({ ...s, pedidos: [], carregando: false, atualizando: false, erro: null, erroAtualizacao: false, sessaoExpirada: true, temDados: false }))
          await ativo.current.expirar()
          return
        }
        const mensagem = e instanceof ErroPedidos ? e.message : MSG_FALHA
        setEstado((s) =>
          s.temDados
            ? { ...s, atualizando: false, erroAtualizacao: true }
            : { ...s, carregando: false, atualizando: false, erro: mensagem },
        )
      })
      .finally(() => {
        if (noAr.current === p) noAr.current = null
      })
    noAr.current = p
    return p
  }, [])

  // Ao abrir (ou trocar de comprador): mostra o cache na hora e atualiza em segundo plano
  useEffect(() => {
    // Depois de uma sessão vencida o comprador some; o aviso de expiração fica até a tela trocar
    setEstado((e) => (!userId && e.sessaoExpirada ? e : estadoInicial(userId)))
    noAr.current = null
    const fresco = !!userId && ultimaBusca?.userId === userId && Date.now() - ultimaBusca.em < JANELA_FRESCA_MS
    if (userId && !(fresco && lerCache(userId))) void executar()
  }, [userId, executar])

  const { temDados: _t, ...publico } = estado
  return { ...publico, recarregar: executar }
}
