import { useEffect, useState } from 'react'
import { erp } from './erp'

// Ajustes públicos (sem segredo) de pagamento online e frete. Vêm da função pública loja_ajustes().
// Desligados por padrão: sem ligar na abas "Pagamento" e "Frete" do /admin, o site segue pelo WhatsApp.
export type ServicoEnvio = { codigo: string; nome: string; ativo: boolean }
export type Ajustes = {
  pagamento: { ligado: boolean }
  frete: { ligado: boolean; embalagem: number; gratisAcima: number; diasExtras: number; servicos: ServicoEnvio[] }
  // Menu do topo: categorias em destaque (slugs) ao lado de "Todos os produtos". Vazio = as primeiras categorias.
  menu: { destaques: string[] }
}

export const AJUSTES_PADRAO: Ajustes = {
  pagamento: { ligado: false },
  menu: { destaques: [] },
  frete: {
    ligado: false,
    embalagem: 0,
    gratisAcima: 0,
    diasExtras: 0,
    servicos: [
      { codigo: '03298', nome: 'PAC', ativo: true },
      { codigo: '03220', nome: 'SEDEX', ativo: true },
    ],
  },
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)

export function normalizarAjustes(bruto: unknown): Ajustes {
  const o = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, any>
  const f = o.frete ?? {}
  const servicos: ServicoEnvio[] = Array.isArray(f.servicos)
    ? f.servicos
        .filter((s: any) => s && /^\d{5}$/.test(String(s.codigo)))
        .map((s: any) => ({ codigo: String(s.codigo), nome: String(s.nome ?? s.codigo).slice(0, 30), ativo: s.ativo !== false }))
    : AJUSTES_PADRAO.frete.servicos
  return {
    pagamento: { ligado: o.pagamento?.ligado === true },
    menu: { destaques: Array.isArray(o.menu?.destaques) ? o.menu.destaques.filter((x: unknown) => typeof x === 'string').slice(0, 20) : [] },
    frete: {
      ligado: f.ligado === true,
      embalagem: Math.max(0, num(f.embalagem)),
      gratisAcima: Math.max(0, num(f.gratisAcima)),
      diasExtras: Math.max(0, Math.round(num(f.diasExtras))),
      servicos,
    },
  }
}

let cache: Ajustes | null = null
let pendente: Promise<Ajustes> | null = null

function carregar(forcar = false): Promise<Ajustes> {
  if (!forcar && cache) return Promise.resolve(cache)
  if (!forcar && pendente) return pendente
  // Os destaques do menu ficam em tabela própria (loja_menu); se falharem, o menu usa as primeiras categorias
  pendente = Promise.all([Promise.resolve(erp.rpc('loja_ajustes')), Promise.resolve(erp.rpc('loja_menu'))])
    .then(([{ data, error }, menu]) => {
      const base = error ? {} : (data as Record<string, unknown> | null) ?? {}
      cache = error ? AJUSTES_PADRAO : normalizarAjustes({ ...base, menu: { destaques: menu.error ? [] : menu.data } })
      return cache
    })
    .catch(() => (cache = AJUSTES_PADRAO))
    .finally(() => {
      pendente = null
    })
  return pendente
}

/** Relê os ajustes do servidor (depois de salvar no /admin). */
export const recarregarAjustes = () => carregar(true)

export function useAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes>(cache ?? AJUSTES_PADRAO)
  const [carregando, setCarregando] = useState(!cache)
  useEffect(() => {
    let vivo = true
    carregar().then((a) => {
      if (vivo) {
        setAjustes(a)
        setCarregando(false)
      }
    })
    return () => {
      vivo = false
    }
  }, [])
  return { ajustes, carregando, recarregar: () => carregar(true).then(setAjustes) }
}
