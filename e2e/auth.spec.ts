import { expect, test, type Page } from '@playwright/test'
import { prepararRede } from './rede'
import sessao from './fixtures/sessao.json' with { type: 'json' }

// Telas de autenticação isoladas: login, cadastro, confirmação, esqueci a senha, nova senha e links vencidos.

const SEM_CASCA = 'header.header, footer.footer, nav[aria-label="Navegação principal"], .whatsapp-flutuante'
const semCasca = (page: Page) => page.locator(SEM_CASCA)
const NAO_CONFIRMADO = { status: 400, corpo: { code: 400, error_code: 'email_not_confirmed', msg: 'Email not confirmed' } }
const LOGIN_OK = { status: 200, corpo: sessao }
const HASH_RECUPERACAO = 'access_token=x&refresh_token=y&expires_in=3600&token_type=bearer&type=recovery'

test('E2E-012 /entrar sem a casca da loja, voltar e cartão centralizado no computador', async ({ page }, info) => {
  await prepararRede(page)
  // No celular o ícone de entrar só existe nas telas raiz da barra superior (subpáginas mostram título e voltar)
  const desktop = info.project.name === 'desktop'
  const origem = desktop ? '/produtos' : '/'
  await page.goto(origem)
  if (desktop) await page.goto(`/entrar?voltar=${encodeURIComponent(origem)}`)
  else await page.getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(new RegExp(`/entrar\\?voltar=${encodeURIComponent(origem)}`))
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  for (let i = 0; i < 5; i++) {
    await expect(semCasca(page)).toHaveCount(0)
    await page.waitForTimeout(100)
  }
  if (info.project.name === 'desktop') {
    const caixa = (await page.locator('.form-auth').boundingBox())!
    expect(caixa.x).toBeGreaterThan(0)
    expect(caixa.width).toBeLessThanOrEqual(440)
  }
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page).toHaveURL(new RegExp(`${origem === '/' ? '/$' : '/produtos$'}`))
})

test('E2E-013 estados do login e retorno para voltar', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/entrar?voltar=%2Fcarrinho')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await page.locator('#senha').fill('errada123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await expect(page.locator('#senha')).toHaveValue('')

  const naoConf = await page.context().newPage()
  await prepararRede(naoConf, { respostas: { '/auth/v1/token': NAO_CONFIRMADO } })
  await naoConf.goto('/entrar')
  await naoConf.getByLabel('E-mail').fill('ana@exemplo.com')
  await naoConf.locator('#senha').fill('Senha123')
  await naoConf.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(naoConf.getByText(/Confirme seu e-mail antes de entrar/)).toBeVisible()
  await naoConf.getByRole('button', { name: 'Reenviar e-mail' }).click()
  await expect(naoConf.getByRole('button', { name: /Reenviar e-mail \(\d+s\)/ })).toBeDisabled()
})

test('E2E-013b login válido volta para voltar e não deixa /entrar no histórico', async ({ page }) => {
  await prepararRede(page, { respostas: { '/auth/v1/token': LOGIN_OK } })
  await page.goto('/carrinho')
  await page.goto('/entrar?voltar=%2Fcarrinho')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await page.locator('#senha').fill('Senha123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await page.goBack()
  await expect(page).not.toHaveURL(/\/entrar/)
})

test('E2E-013c voltar para endereço externo cai em /conta', async ({ page }) => {
  await prepararRede(page, { respostas: { '/auth/v1/token': LOGIN_OK } })
  await page.goto('/entrar?voltar=https://evil.com')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await page.locator('#senha').fill('Senha123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/conta/)
})

test('E2E-014 cadastro, confirmação e reenvio', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/cadastro?voltar=%2Fcheckout')
  await page.getByLabel('Nome').fill('Ana Souza')
  await page.getByLabel('WhatsApp').fill('11999999999')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await page.locator('#senha').fill('Senha123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/confirme-email\?voltar=%2Fcheckout/)
  await expect(page.getByText('ana@exemplo.com')).toBeVisible()
  await page.getByRole('button', { name: 'Reenviar e-mail' }).click()
  await expect(page.getByText('E-mail reenviado.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Reenviar e-mail \(\d+s\)/ })).toBeDisabled()
  await page.getByRole('link', { name: 'Voltar para entrar' }).click()
  await expect(page).toHaveURL(/\/entrar\?voltar=%2Fcheckout/)
})

test('E2E-015 esqueci a senha e nova senha pelo link', async ({ page }) => {
  await prepararRede(page, { respostas: { '/auth/v1/user': { corpo: sessao.user } } })
  await page.goto('/entrar')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByLabel('E-mail')).toHaveValue('ana@exemplo.com')
  await page.getByRole('button', { name: 'Enviar link' }).click()
  await expect(page.getByText(/Se existir uma conta com esse e-mail/)).toBeVisible()

  await page.goto(`/redefinir-senha#${HASH_RECUPERACAO}`)
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123')
  await page.getByLabel('Confirmar nova senha').fill('NovaSenha123')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page).toHaveURL(/\/conta/)
  await expect(page.getByText('Senha alterada')).toBeVisible()
})

test('E2E-016 links inválidos ou vencidos', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/redefinir-senha#error=access_denied&error_code=otp_expired')
  await expect(page.getByText('Link inválido ou expirado').first()).toBeVisible()
  await page.getByRole('link', { name: 'Pedir novo link' }).click()
  await expect(page).toHaveURL(/\/esqueci-senha/)

  await page.goto('/#error_code=otp_expired')
  await expect(page).toHaveURL(/\/entrar\?aviso=link-expirado/)
  await expect(page.getByText('Link inválido ou expirado. Entre ou peça um novo link.')).toBeVisible()
})
