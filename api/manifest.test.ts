import { afterEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error handler em JS puro (função da Vercel)
import handler from './manifest.js'

type Res = { headers: Record<string, string>; corpo: string; setHeader(k: string, v: string): void; status(n: number): Res; send(c: string): void }

function chamar(): Res {
  const res: Res = {
    headers: {},
    corpo: '',
    setHeader(k, v) {
      this.headers[k] = v
    },
    status() {
      return this
    },
    send(c) {
      this.corpo = c
    },
  }
  return res
}

async function gerar(config: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(config), { status: 200 })))
  const res = chamar()
  await handler({}, res)
  return { res, json: JSON.parse(res.corpo) }
}

afterEach(() => vi.unstubAllGlobals())

describe('api/manifest', () => {
  it('UT-348 sem iconeApp: ícones padrão e id', async () => {
    const { json } = await gerar({ empresa: { nome: 'Gráfica X' }, aparencia: {} })
    expect(json.icons).toEqual([
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ])
    expect(json).toMatchObject({ id: '/', start_url: '/', display: 'standalone' })
  })

  it('UT-349 iconeApp configurado vale', async () => {
    const { json } = await gerar({ aparencia: { iconeApp: 'https://cdn/x.png' } })
    expect(json.icons.map((i: { src: string; sizes: string }) => [i.src, i.sizes])).toEqual([
      ['https://cdn/x.png', '192x192'],
      ['https://cdn/x.png', '512x512'],
    ])
  })

  it('UT-350 / IT-021 ERP falha: padrões', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))))
    const res = chamar()
    await handler({}, res)
    const json = JSON.parse(res.corpo)
    expect(json.name).toBe('Master Print')
    expect(json.icons[0].src).toBe('/icones/icone-192.png')
  })

  it('IT-021 nome da empresa vem do ERP', async () => {
    const { json } = await gerar({ empresa: { nome: 'Gráfica X' }, aparencia: {} })
    expect(json.name).toBe('Gráfica X')
  })

  it('UT-351 cor inválida: azul padrão', async () => {
    const { json } = await gerar({ aparencia: { cor: 'blue' } })
    expect(json.theme_color).toBe('#3b82f6')
  })

  it('UT-352 cabeçalhos', async () => {
    const { res } = await gerar({})
    expect(res.headers['Content-Type']).toBe('application/manifest+json; charset=utf-8')
    expect(res.headers['Cache-Control']).toContain('s-maxage=60')
  })
})
