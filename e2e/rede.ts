import type { Page, Route } from '@playwright/test'
import catalogo from './fixtures/catalogo.json' with { type: 'json' }
import config from './fixtures/config.json' with { type: 'json' }
import paginas from './fixtures/paginas.json' with { type: 'json' }
import pedidos from './fixtures/pedidos.json' with { type: 'json' }
import perfil from './fixtures/perfil.json' with { type: 'json' }
import enderecos from './fixtures/enderecos.json' with { type: 'json' }
import sessao from './fixtures/sessao.json' with { type: 'json' }

// Toda a rede do navegador passa por aqui: o site local segue normal, Supabase (compradores e ERP)
// responde das fixtures e qualquer outro endereço externo é bloqueado e anotado em `bloqueadas`.

export const CHAVE_SESSAO = 'sb-tupbkbivxlaaglspgybi-auth-token'
export const CHAVE_SESSAO_ERP = 'loja-erp-auth'
const HOST_COMPRADORES = 'tupbkbivxlaaglspgybi.supabase.co'

type Resposta = { status?: number; corpo?: unknown }

export type OpcoesRede = {
  /** Abre já com o comprador logado (sessão de fixtures/sessao.json). */
  sessao?: boolean
  /** Abre já com login de administrador do ERP. */
  adminErp?: boolean
  /** Respostas trocadas por caminho (ex.: `'/functions/v1/loja-meus-pedidos': { status: 401 }`). */
  respostas?: Record<string, Resposta | ((route: Route) => Promise<void>)>
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-expose-headers': '*',
}

export const sessaoAdminErp = {
  ...sessao,
  user: { ...sessao.user, id: 'u-admin', email: 'dono@masterprint.teste', app_metadata: { provider: 'email', role: 'admin' } },
}

function json(route: Route, corpo: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: corpo === undefined ? '' : JSON.stringify(corpo),
  })
}

/** Responde uma requisição interceptada com JSON (para respostas dinâmicas em `respostas`), opcionalmente atrasada. */
export async function responder(route: Route, corpo: unknown, status = 200, atrasoMs = 0) {
  if (atrasoMs) await new Promise((ok) => setTimeout(ok, atrasoMs))
  return json(route, corpo, status)
}

/** Intercepta a rede da página. Chame antes do primeiro `page.goto`. */
export async function prepararRede(page: Page, opcoes: OpcoesRede = {}) {
  const bloqueadas: string[] = []
  const chamadas: { metodo: string; url: string }[] = []

  if (opcoes.sessao || opcoes.adminErp) {
    // Semeia o login uma vez por aba (sair continua funcionando depois de recarregar)
    await page.addInitScript(
      ({ chaves }) => {
        if (sessionStorage.getItem('e2e-sessao-semeada')) return
        sessionStorage.setItem('e2e-sessao-semeada', '1')
        for (const [k, v] of chaves) localStorage.setItem(k, v)
      },
      {
        chaves: [
          ...(opcoes.sessao ? [[CHAVE_SESSAO, JSON.stringify(sessao)]] : []),
          ...(opcoes.adminErp ? [[CHAVE_SESSAO_ERP, JSON.stringify(sessaoAdminErp)]] : []),
        ],
      },
    )
  }

  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      if (url.pathname === '/api/manifest') return json(route, { name: 'Master Print', start_url: '/', display: 'standalone', icons: [] })
      return route.continue()
    }
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' })
    if (!url.hostname.endsWith('.supabase.co')) {
      bloqueadas.push(req.url())
      return route.abort('blockedbyclient')
    }

    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    chamadas.push({ metodo: req.method(), url: req.url() })

    const trocada = opcoes.respostas?.[url.pathname]
    if (typeof trocada === 'function') return trocada(route)
    if (trocada) return json(route, trocada.corpo ?? {}, trocada.status ?? 200)

    const compradores = url.hostname === HOST_COMPRADORES
    const caminho = url.pathname

    if (caminho === '/auth/v1/user') {
      if (compradores) return opcoes.sessao ? json(route, sessao.user) : json(route, { message: 'invalid JWT' }, 401)
      return opcoes.adminErp ? json(route, sessaoAdminErp.user) : json(route, { message: 'invalid JWT' }, 401)
    }
    if (caminho === '/auth/v1/token') {
      const s = compradores ? sessao : sessaoAdminErp
      if ((compradores && opcoes.sessao) || (!compradores && opcoes.adminErp)) return json(route, s)
      return json(route, { error: 'invalid_grant', error_description: 'Invalid login credentials' }, 400)
    }
    if (caminho === '/auth/v1/logout') return route.fulfill({ status: 204, headers: CORS })
    if (caminho.startsWith('/auth/v1/')) return json(route, {})

    if (!compradores) {
      if (caminho === '/rest/v1/rpc/loja_config') return json(route, config)
      if (caminho === '/rest/v1/rpc/loja_paginas') return json(route, paginas)
      if (caminho === '/rest/v1/rpc/loja_catalogo_v2') return json(route, catalogo)
      if (caminho === '/functions/v1/loja-meus-pedidos') return json(route, pedidos)
      if (caminho.startsWith('/functions/v1/')) return json(route, {})
      return json(route, [])
    }

    const umObjeto = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    if (caminho === '/rest/v1/perfis') return json(route, req.method() === 'GET' ? (umObjeto ? perfil : [perfil]) : null, req.method() === 'GET' ? 200 : 201)
    if (caminho === '/rest/v1/enderecos') return json(route, req.method() === 'GET' ? enderecos : [], req.method() === 'GET' ? 200 : 201)
    if (caminho.startsWith('/functions/v1/')) return json(route, {})
    return json(route, [])
  })

  return { bloqueadas, chamadas }
}
