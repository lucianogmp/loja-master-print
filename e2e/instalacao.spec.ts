import { expect, test } from '@playwright/test'
import { prepararRede } from './rede'
import handler from '../api/manifest.js'

const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

test.describe('modo instalado', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'celular'))

  test('E2E-031 safe areas e theme-color', async ({ page }) => {
    await prepararRede(page)
    await page.goto('/')
    const cor = () => page.locator('meta[name=theme-color]').getAttribute('content')
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom').trim())).not.toBe('')
    const nav = page.locator('nav.barra-inferior').first()
    await expect(nav).toBeVisible()
    const [pad, safe] = await nav.evaluate((el) => {
      const probe = document.createElement('div')
      probe.style.paddingBottom = 'var(--safe-bottom)'
      document.body.append(probe)
      const s = parseFloat(getComputedStyle(probe).paddingBottom)
      probe.remove()
      return [parseFloat(getComputedStyle(el).paddingBottom), s]
    })
    expect(pad).toBeGreaterThanOrEqual(safe)
    await page.evaluate(() => localStorage.setItem('master-print-theme', 'dark'))
    await page.reload()
    expect(await cor()).toBe('#0f172a')
    await page.evaluate(() => localStorage.setItem('master-print-theme', 'light'))
    await page.reload()
    expect(await cor()).toBe('#f8fbff')

    await page.goto('/entrar')
    const auth = await page.locator('.auth').evaluate((el) => getComputedStyle(el).paddingTop)
    expect(parseFloat(auth)).toBeGreaterThanOrEqual(0)

    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/')
    const larg = await page.locator('nav.barra-inferior, header').first().evaluate((el) => el.getBoundingClientRect().width)
    expect(Math.round(larg)).toBe(844)
  })

  test('E2E-032 dica de instalação', async ({ page }) => {
    await prepararRede(page)
    await page.addInitScript(() => {
      const e = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: async () => void ((window as unknown as { __prompt: number }).__prompt = ((window as unknown as { __prompt?: number }).__prompt ?? 0) + 1),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      })
      window.addEventListener('DOMContentLoaded', () => setTimeout(() => window.dispatchEvent(e), 0))
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu.getByText('Adicione à tela inicial')).toBeVisible()
    await menu.getByRole('button', { name: 'Adicionar' }).click()
    await expect(menu.locator('.dica-instalar')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __prompt: number }).__prompt)).toBe(1)
  })

  test('E2E-032 sem pedido nativo: folha, Agora não, expiração', async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: UA_IPHONE + ' Instagram 300.0', viewport: { width: 412, height: 800 }, hasTouch: true })
    const page = await ctx.newPage()
    await prepararRede(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await menu.getByRole('button', { name: 'Adicionar' }).click()
    const folha = page.getByRole('dialog', { name: /tela inicial/ })
    await expect(folha).toContainText('Toque em Compartilhar')
    await expect(folha).toContainText('Abra no navegador do aparelho para instalar')
    await folha.getByRole('button', { name: 'Fechar' }).click()
    await menu.getByRole('button', { name: 'Agora não' }).click()
    await expect(menu.locator('.dica-instalar')).toHaveCount(0)
    await page.reload()
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' }).locator('.dica-instalar')).toHaveCount(0)
    // 31 dias depois, com o armazenamento limpo, a dica volta
    await page.evaluate(() => localStorage.removeItem('loja-dica-instalar'))
    await page.reload()
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' }).locator('.dica-instalar')).toBeVisible()
    await ctx.close()
  })
})

test('E2E-033 manifesto padrão, PNG e ícone de toque antes da configuração', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'celular')
  const original = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify({ empresa: { nome: 'Master Print' }, aparencia: {} }))) as typeof fetch
  let corpo = ''
  await handler({}, { setHeader() {}, status() { return this }, send(c: string) { corpo = c } })
  globalThis.fetch = original
  const m = JSON.parse(corpo)
  expect(m).toMatchObject({ display: 'standalone', start_url: '/' })
  expect(m.icons.map((i: { src: string }) => i.src)).toEqual(['/icones/icone-192.png', '/icones/icone-512.png', '/icones/icone-512-maskable.png'])

  await prepararRede(page, { respostas: { '/rest/v1/rpc/loja_config': { status: 500, corpo: {} } } })
  await page.route('**/rest/v1/rpc/loja_config', (r) => r.abort())
  await page.goto('/')
  await expect(page.locator('link[rel=apple-touch-icon]')).toHaveAttribute('href', /icone-180\.png/)
  const png = await request.get('/icones/icone-180.png')
  expect(png.status()).toBe(200)
  expect(png.headers()['content-type']).toContain('image/png')
})
