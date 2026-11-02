import { expect, test } from '@playwright/test'
import { prepararRede } from './rede'

test('a loja abre só com a rede interceptada', async ({ page }) => {
  const rede = await prepararRede(page)
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Cartão de visita/ }).first()).toBeVisible()
  expect(rede.chamadas.some((c) => c.url.includes('/rpc/loja_catalogo_v2'))).toBe(true)
  expect(rede.bloqueadas.filter((u) => !u.startsWith('https://fonts.gstatic.com'))).toEqual([])
})

for (const caminho of ['/entrar', '/cadastro', '/admin']) {
  test(`${caminho} abre sem a casca da loja`, async ({ page }) => {
    await prepararRede(page, { adminErp: caminho === '/admin' })
    await page.goto(caminho)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.locator('header.header')).toHaveCount(0)
    await expect(page.locator('footer.footer')).toHaveCount(0)
    await expect(page.locator('.whatsapp-flutuante')).toHaveCount(0)
  })
}
