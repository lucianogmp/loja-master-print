import { vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'

// Clientes Supabase falsos (compradores e ERP): só a fronteira de rede é trocada; o resto do app roda de verdade.

type Ouvinte = (evento: string, sessao: Session | null) => void
type Resultado = { data: unknown; error: unknown }

function criarAuthFake() {
  const ouvintes = new Set<Ouvinte>()
  const auth = {
    sessao: null as Session | null,
    getSession: vi.fn(async () => ({ data: { session: auth.sessao }, error: null })),
    onAuthStateChange: vi.fn((cb: Ouvinte) => {
      ouvintes.add(cb)
      return { data: { subscription: { unsubscribe: () => void ouvintes.delete(cb) } } }
    }),
    signInWithPassword: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })),
    signUp: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })),
    resetPasswordForEmail: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })),
    updateUser: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })),
    resend: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })),
    signOut: vi.fn(async () => {
      auth.emitir('SIGNED_OUT', null)
      return { error: null }
    }),
    /** Simula um evento do Supabase Auth (SIGNED_IN, SIGNED_OUT, PASSWORD_RECOVERY…). */
    emitir(evento: string, sessao: Session | null) {
      auth.sessao = sessao
      ouvintes.forEach((cb) => cb(evento, sessao))
    },
  }
  return auth
}

/** Consulta encadeável (`from().select().eq()…`) que resolve com o resultado dado. */
export function consultaFake(resultado: Resultado = { data: [], error: null }): unknown {
  const alvo: unknown = new Proxy(function () {}, {
    get: (_, prop) =>
      prop === 'then'
        ? (ok: (r: Resultado) => unknown, falha: (e: unknown) => unknown) => Promise.resolve(resultado).then(ok, falha)
        : () => alvo,
    apply: () => alvo,
  })
  return alvo
}

export type ChamadaTabela = { tabela: string; metodos: { nome: string; args: unknown[] }[] }

/**
 * Faz `supabase.from(tabela)` responder pelo `resolver` e anota cada consulta (tabela + métodos encadeados),
 * para o teste conferir o que foi gravado.
 */
export function instalarTabelas(resolver: (c: ChamadaTabela) => Resultado | Promise<Resultado>) {
  const chamadas: ChamadaTabela[] = []
  supabaseFake.from.mockImplementation(((tabela: string) => {
    const c: ChamadaTabela = { tabela, metodos: [] }
    chamadas.push(c)
    const alvo: unknown = new Proxy(function () {}, {
      get: (_, prop) =>
        prop === 'then'
          ? (ok: (r: Resultado) => unknown, falha: (e: unknown) => unknown) => Promise.resolve(resolver(c)).then(ok, falha)
          : (...args: unknown[]) => {
              c.metodos.push({ nome: String(prop), args })
              return alvo
            },
    })
    return alvo
  }) as never)
  return chamadas
}

/** As consultas de uma tabela que usaram o método dado (ex.: `usou(chamadas, 'perfis', 'upsert')`). */
export const usou = (chamadas: ChamadaTabela[], tabela: string, metodo: string) =>
  chamadas.filter((c) => c.tabela === tabela && c.metodos.some((m) => m.nome === metodo))

const respostasRpc = new Map<string, unknown>()
const rpcsComErro = new Set<string>()

export const supabaseFake = {
  auth: criarAuthFake(),
  from: vi.fn(() => consultaFake()),
  functions: { invoke: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })) },
}

export const erpFake = {
  auth: criarAuthFake(),
  from: vi.fn(() => consultaFake()),
  rpc: vi.fn(
    async (nome: string): Promise<Resultado> =>
      rpcsComErro.has(nome) ? { data: null, error: { message: 'falha simulada' } } : { data: respostasRpc.get(nome) ?? null, error: null },
  ),
  storage: { from: vi.fn(() => consultaFake()) },
  functions: { invoke: vi.fn(async (): Promise<Resultado> => ({ data: {}, error: null })) },
}

/** Define a resposta de uma RPC do ERP (`loja_config`, `loja_paginas`, `loja_catalogo_v2`). */
export function definirRpc(nome: string, dados: unknown) {
  respostasRpc.set(nome, dados)
}

/** Faz a RPC do ERP responder com erro. */
export function falharRpc(nome: string) {
  rpcsComErro.add(nome)
}

/** Linhas mínimas de `loja_catalogo_v2` para as categorias dadas (um produto por categoria). */
export function linhasCatalogo(categorias: { slug: string; nome: string }[]) {
  return categorias.map((c, i) => ({
    id: `p${i}`,
    slug: `produto-${c.slug}`,
    nome: `Produto ${c.nome}`,
    categoria: c.nome,
    categoria_original: c.slug,
    categoria_imagem: null,
    categoria_ordem: i,
    por_metro_quadrado: false,
    preco: 10,
    prazo_entrega_dias: 3,
    descricao_publica: null,
    imagens: [],
    peso_kg: null,
    comprimento_cm: null,
    largura_cm: null,
    altura_cm: null,
    entrega_modo: 'envio_e_retirada',
    destaque: true,
    ordem: i,
  }))
}

export function sessaoFake({
  id = 'u1',
  email = 'ana@exemplo.com',
  nome,
  papel,
}: { id?: string; email?: string; nome?: string; papel?: string } = {}): Session {
  return {
    access_token: `token-${id}`,
    refresh_token: `refresh-${id}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id,
      email,
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      app_metadata: papel ? { role: papel } : {},
      user_metadata: nome ? { nome } : {},
    },
  } as Session
}

export function resetarFakes() {
  respostasRpc.clear()
  rpcsComErro.clear()
  supabaseFake.from.mockReset() // tabelas programadas por instalarTabelas não vazam
  erpFake.rpc.mockReset() // volta à implementação original (testes que seguram uma RPC não vazam)
  supabaseFake.auth.sessao = null
  erpFake.auth.sessao = null
  vi.clearAllMocks()
}
