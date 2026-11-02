import { expect, test } from '@playwright/test'
import { prepararRede } from './rede'

test.describe('Computador', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'só no computador'))

  test('E2E-035 cabeçalho de sempre, com Entrar e depois o avatar; sem barra inferior nem menu', async ({ page }) => {
    await prepararRede(page)
    await page.goto('/')
    const header = page.locator('header.header')
    await expect(header.locator('.barra-topo')).toContainText('Seg a Sex, 8h às 18h')
    await expect(header.getByRole('search')).toBeVisible()
    await expect(header.getByRole('button', { name: /Ativar tema/ })).toBeVisible()
    await expect(header.getByRole('link', { name: /Carrinho/ })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0)
  })

  test('E2E-035 logado: avatar levando para /conta', async ({ page }) => {
    await prepararRede(page, { sessao: true })
    await page.goto('/')
    const conta = page.locator('header.header').getByRole('link', { name: 'Minha conta' })
    await expect(conta).toHaveAttribute('href', '/conta')
    await expect(conta.locator('.avatar-p')).toHaveText('AS')
    await expect(page.locator('header.header').getByRole('link', { name: 'Entrar' })).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0)
  })
})
