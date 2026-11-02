import { expect, test } from '@playwright/test'
import { prepararRede } from './rede'

// Administração: sem a casca da loja; gaveta no celular, menu fixo no computador; voltar à loja restaura a casca.

const SECOES = ['Produtos', 'Derivados', 'Categorias', 'Página inicial', 'Dados da empresa', 'Aparência', 'Páginas de texto']

test('E2E-034 admin sem a casca da loja; gaveta e menu fixo; voltar à loja', async ({ page }, info) => {
  await prepararRede(page, { sessao: true, adminErp: true })
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Administração da loja' })).toBeVisible()

  // Nenhuma peça da loja dentro do admin
  await expect(page.locator('header.header')).toHaveCount(0)
  await expect(page.locator('footer.footer')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
  await expect(page.locator('.whatsapp-flutuante')).toHaveCount(0)

  if (info.project.name === 'celular') {
    await expect(page.locator('header.admin-topo')).toBeVisible()
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const gaveta = page.getByRole('dialog', { name: 'Menu da administração' })
    await expect(gaveta).toBeVisible()
    for (const secao of SECOES) await expect(gaveta.getByRole('button', { name: secao, exact: true })).toBeVisible()
    await expect(gaveta.getByRole('link', { name: 'Voltar à loja' })).toBeVisible()
    await expect(gaveta.getByRole('button', { name: 'Sair' })).toBeVisible()
    await expect(gaveta.getByText('Tema')).toBeVisible()

    await gaveta.getByRole('button', { name: 'Aparência', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Cor principal' })).toBeVisible()

    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog', { name: 'Menu da administração' }).getByRole('link', { name: 'Voltar à loja' }).click()
  } else {
    const lateral = page.locator('nav.admin-menu')
    await expect(lateral).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0)
    await lateral.getByRole('button', { name: 'Aparência', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Cor principal' })).toBeVisible()

    await lateral.getByRole('link', { name: 'Voltar à loja' }).click()
  }

  // De volta à loja: casca inteira, com Início marcado
  await expect(page).toHaveURL('/')
  await expect(page.locator('header.header').or(page.locator('header.barra-topo-app'))).toBeVisible()
  if (info.project.name === 'celular') {
    await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Início' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  } else {
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
  }
})

test('E2E-034 celular: "Administração" no menu da loja fecha a gaveta antes do admin aparecer', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'só no celular')
  await prepararRede(page, { sessao: true, adminErp: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Administração' }).click()
  await expect(page.getByRole('heading', { name: 'Administração da loja' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
