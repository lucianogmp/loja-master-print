import { createContext, createElement, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, type NavigationType, type UIMatch } from 'react-router-dom'

// Metadados de cada tela da loja (o "handle" das rotas em src/rotas.tsx).
// A casca do celular lê daqui a aba dona, o nível (raiz/subpágina), o título e se esconde a barra.

export type Aba = 'inicio' | 'buscar' | 'carrinho' | 'pedidos' | 'conta'

export type Handle = {
  nivel: 'raiz' | 'sub'
  aba?: Aba // aba dona; sem aba → nenhuma aba destacada
  titulo?: string // título fixo da subpágina; a página pode trocar com useTitulo()
  semBarra?: true // esconde a barra inferior e o botão do WhatsApp (finalizar pedido)
  chips?: true // mostra as categorias em fichas no topo da página, no celular
  semWhatsApp?: true // esconde só o botão flutuante: a tela já tem atalho de WhatsApp próprio ou campos de formulário
}

export const ABAS: { aba: Aba; rotulo: string; para: string }[] = [
  { aba: 'inicio', rotulo: 'Início', para: '/' },
  { aba: 'buscar', rotulo: 'Buscar', para: '/buscar' },
  { aba: 'carrinho', rotulo: 'Carrinho', para: '/carrinho' },
  { aba: 'pedidos', rotulo: 'Pedidos', para: '/pedidos' },
  { aba: 'conta', rotulo: 'Conta', para: '/conta' },
]

/** Consulta única que decide "celular" (a mesma largura usada no CSS da casca). */
export const CONSULTA_MOBILE = '(max-width: 767.98px)'

/** O handle da rota mais interna que declarou um. */
export function handleAtual(matches: Pick<UIMatch, 'handle'>[]): Handle | undefined {
  for (let i = matches.length - 1; i >= 0; i--) {
    const h = matches[i].handle as Handle | undefined
    if (h) return h
  }
  return undefined
}

export type Direcao = 'push' | 'pop' | 'nenhuma'

/** Sentido da animação entre telas: entrar numa subpágina empurra, voltar dela recua; o resto troca sem animar. */
export function direcaoTransicao(
  tipo: NavigationType | `${NavigationType}`,
  anterior: Handle | undefined,
  atual: Handle | undefined,
  mobile: boolean,
): Direcao {
  if (!mobile) return 'nenhuma'
  if (tipo === 'POP') return anterior?.nivel === 'sub' ? 'pop' : 'nenhuma'
  return atual?.nivel === 'sub' ? 'push' : 'nenhuma'
}

/** Para onde o "voltar" da barra leva: a entrada anterior da loja, ou a raiz da aba dona. */
export function destinoAoVoltar(handle: Handle | undefined, temHistoricoInterno: boolean): string | number {
  if (temHistoricoInterno) return -1
  return ABAS.find((a) => a.aba === handle?.aba)?.para ?? '/'
}

const ABAS_LEGADAS: Record<string, string> = {
  pedidos: '/pedidos',
  dados: '/conta/dados',
  enderecos: '/conta/enderecos',
  seguranca: '/conta/seguranca',
  privacidade: '/conta/privacidade',
}

/** Links antigos `/conta?aba=…` → tela nova (null: sem `aba` ou valor desconhecido, que abre o hub). */
export function destinoAbaLegada(search: string): string | null {
  const aba = new URLSearchParams(search).get('aba')
  return aba && Object.hasOwn(ABAS_LEGADAS, aba) ? ABAS_LEGADAS[aba] : null
}

/** true quando existe uma entrada anterior desta loja no histórico (não é a primeira tela aberta). */
export function useTemHistoricoInterno(): boolean {
  const { key } = useLocation()
  const idx = (window.history.state as { idx?: unknown } | null)?.idx
  return typeof idx === 'number' ? idx > 0 : key !== 'default'
}

// ---------- Título dinâmico das subpáginas ----------

type Tela = { titulo: string | undefined; definir: (titulo: string | undefined) => void }
const TelaContext = createContext<Tela>({ titulo: undefined, definir: () => {} })

/** Guarda o título que a página atual definiu; zera ao mudar de caminho. */
export function TelaProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const caminho = useRef(pathname)
  caminho.current = pathname
  const [estado, setEstado] = useState<{ pathname: string; titulo: string | undefined }>({ pathname, titulo: undefined })
  const definir = useCallback((titulo: string | undefined) => setEstado({ pathname: caminho.current, titulo }), [])
  const titulo = estado.pathname === pathname ? estado.titulo : undefined
  const valor = useMemo(() => ({ titulo, definir }), [titulo, definir])
  return createElement(TelaContext.Provider, { value: valor }, children)
}

/** A página chama para trocar o título da barra (nome do produto, número do pedido…) enquanto estiver montada. */
export function useTitulo(titulo: string | undefined): void {
  const { definir } = useContext(TelaContext)
  useLayoutEffect(() => {
    definir(titulo)
    return () => definir(undefined)
  }, [titulo, definir])
}

export const useTituloDaTela = () => useContext(TelaContext).titulo

// ---------- Contexto da casca da loja (preenchido por LojaShell) ----------

export type Shell = { ehMobile: boolean; handle: Handle | undefined; titulo: string | undefined }
export const ShellContext = createContext<Shell | null>(null)
