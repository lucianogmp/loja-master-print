import { expect, test, type Page } from '@playwright/test'
import { prepararRede, responder } from './rede'
import sessao from './fixtures/sessao.json' with { type: 'json' }

// Avatar, avisos de login, lista de pedidos (cache, atualização, puxar) e detalhe com a linha do tempo.

const ERP_PEDIDOS = '/functions/v1/loja-meus-pedidos'
const LOGIN_OK = { status: 200, corpo: sessao }
const itens = (n: number) => Array.from({ length: n }, (_, i) => ({ descricao: `Item ${i + 1}`, quantidade: 1, preco_unitario: 1, total: 1 }))
const pedido = (numero: number, extra: Record<string, unknown> = {}) => ({
  numero,
  data: `2026-03-${String(10 + (numero % 18)).padStart(2, '0')}T15:00:00Z`,
  total: 120,
  etapa: 2,
  situacao: 'Em produção',
  recebimento: 'Entrega',
  endereco: 'Rua das Flores, 10 — Centro, Teófilo Otoni/MG',
  itens: [
    { descricao: 'Cartão de visita', quantidade: 500, preco_unitario: 0.1, total: 50 },
    { descricao: 'Banner', quantidade: 1, preco_unitario: 70, total: 70 },
  ],
  ...extra,
})

const soCelular = () => test.beforeEach(({}, info) => test.skip(info.project.name !== 'celular', 'só no celular'))
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegação principal' })
const cartoes = (page: Page) => page.locator('a.cartao-pedido')
const pedidosChamados = (chamadas: { url: string }[]) => chamadas.filter((c) => c.url.endsWith('loja-meus-pedidos')).length

test.describe('Avatar e avisos de login', () => {
  test('E2E-017 avatar com iniciais em todos os pontos, mesma cor', async ({ page }, info) => {
    await prepararRede(page, { sessao: true })
    await page.goto('/')
    if (info.project.name === 'desktop') {
      const av = page.locator('header.header .avatar')
      await expect(av).toHaveText('AS')
      return
    }
    const barra = page.locator('.barra-topo-app .avatar')
    const aba = nav(page).locator('.avatar')
    await expect(barra).toHaveText('AS')
    await expect(aba).toHaveText('AS')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const gaveta = page.getByRole('dialog').locator('.avatar').first()
    await expect(gaveta).toHaveText('AS')
    const cor = (l: typeof barra) => l.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(await cor(gaveta)).toBe(await cor(barra))
    expect(await cor(aba)).toBe(await cor(barra))
    await page.keyboard.press('Escape')
    await page.goto('/conta')
    const hub = page.locator('.hub-cabecalho .avatar')
    await expect(hub).toHaveText('AS')
    expect(await cor(hub)).toBe(await cor(barra))
  })

  test.describe('celular', () => {
    soCelular()

    test('E2E-018 sem login: convites de Pedidos e Conta e retorno depois de entrar', async ({ page }) => {
      await prepararRede(page, { respostas: { '/auth/v1/token': LOGIN_OK } })
      await page.goto('/')
      await nav(page).getByRole('link', { name: 'Pedidos' }).click()
      await expect(page.getByRole('heading', { name: 'Entre para ver seus pedidos' })).toBeVisible()
      await expect(nav(page)).toBeVisible()
      await expect(nav(page).getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page')
      await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
      await expect(page).toHaveURL(/\/entrar\?voltar=%2Fpedidos/)
      await page.getByLabel('E-mail').fill('ana@exemplo.com')
      await page.locator('#senha').fill('Senha123')
      await page.getByRole('button', { name: 'Entrar', exact: true }).click()
      await expect(page).toHaveURL(/\/pedidos$/)
      await expect(page.getByRole('heading', { name: 'Meus pedidos' })).toBeVisible()

    })

    test('E2E-018b sem login em /conta/enderecos: convite e retorno depois de entrar', async ({ page }) => {
      await prepararRede(page, { respostas: { '/auth/v1/token': LOGIN_OK } })
      await page.goto('/conta/enderecos')
      await expect(page.getByRole('heading', { name: 'Entre para acessar sua conta' })).toBeVisible()
      await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
      await page.getByLabel('E-mail').fill('ana@exemplo.com')
      await page.locator('#senha').fill('Senha123')
      await page.getByRole('button', { name: 'Entrar', exact: true }).click()
      await expect(page).toHaveURL(/\/conta\/enderecos$/)
    })
  })

  test('E2E-019 sessão vencida (401 do ERP): aviso, sessão e cache limpos, Entrar volta para Pedidos', async ({ page }) => {
    await prepararRede(page, { sessao: true, respostas: { [ERP_PEDIDOS]: { status: 401, corpo: {} } } })
    await page.goto('/pedidos')
    await expect(page.getByRole('heading', { name: 'Sua sessão expirou. Entre novamente.' }).first()).toBeVisible()
    const chaves = await page.evaluate(() => Object.keys(localStorage))
    expect(chaves.filter((k) => k.startsWith('loja-pedidos:') || k === 'sb-tupbkbivxlaaglspgybi-auth-token')).toEqual([])
    await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/entrar\?voltar=%2Fpedidos/)
  })
})

test.describe('Lista de pedidos', () => {
  test('E2E-020 cartões, retorno instantâneo com cache, atualização e falha de atualização', async ({ page }) => {
    let modo: 'ok' | 'lento4' | 'erro' = 'ok'
    const tres = [pedido(12), pedido(11, { etapa: 4, situacao: 'Entregue' }), pedido(10, { etapa: 0, situacao: 'Cancelado' })]
    const { chamadas } = await prepararRede(page, {
      sessao: true,
      respostas: {
        [ERP_PEDIDOS]: (route) =>
          modo === 'erro'
            ? responder(route, { erro: 'x' }, 500)
            : modo === 'lento4'
              ? responder(route, { pedidos: [pedido(13), ...tres] }, 200, 3000)
              : responder(route, { pedidos: tres }),
      },
    })
    await page.goto('/pedidos')
    await expect(cartoes(page)).toHaveCount(3)
    const primeiro = cartoes(page).first()
    await expect(primeiro).toContainText('Pedido nº 12')
    await expect(primeiro).toContainText(/\d{2}\/\d{2}\/2026/)
    await expect(primeiro).toContainText('R$')
    await expect(primeiro.locator('.truncar')).toHaveCSS('text-overflow', 'ellipsis')
    await expect(cartoes(page).nth(1).locator('.chip')).toHaveClass(/etapa-4/)
    await expect(cartoes(page).nth(2).locator('.chip')).toHaveClass(/cancelado/)

    modo = 'lento4'
    await page.reload()
    await expect(cartoes(page)).toHaveCount(3, { timeout: 300 }) // do cache, antes de o ERP responder
    await expect(cartoes(page)).toHaveCount(4, { timeout: 6000 })

    modo = 'erro'
    const antes = pedidosChamados(chamadas)
    await page.reload()
    await expect(page.getByText(/Não foi possível atualizar/)).toBeVisible()
    expect(pedidosChamados(chamadas)).toBeGreaterThan(antes)
    await expect(cartoes(page)).toHaveCount(4)
  })

  test.describe('celular', () => {
    soCelular()

    test('E2E-021 puxar para atualizar: só no topo e uma por vez', async ({ page }) => {
      const muitos = Array.from({ length: 40 }, (_, i) => pedido(100 - i))
      let atraso = 0
      const { chamadas } = await prepararRede(page, { sessao: true, respostas: { [ERP_PEDIDOS]: (route) => responder(route, { pedidos: muitos }, 200, atraso) } })
      await page.goto('/pedidos')
      await expect(cartoes(page)).toHaveCount(40)
      await expect(page.getByText('Atualizando...')).toHaveCount(0)
      const puxar = (deY: number, ateY: number) =>
        page.evaluate(
          ([de, ate]) => {
            const alvo = document.querySelector('.lista-pedidos')!
            const toque = (y: number) => new Touch({ identifier: 1, target: alvo, clientX: 100, clientY: y })
            const disparar = (tipo: string, y: number) =>
              alvo.dispatchEvent(new TouchEvent(tipo, { bubbles: true, cancelable: true, touches: tipo === 'touchend' ? [] : [toque(y)], changedTouches: [toque(y)] }))
            disparar('touchstart', de)
            disparar('touchmove', ate)
            disparar('touchend', ate)
          },
          [deY, ateY],
        )
      const base = pedidosChamados(chamadas)
      await puxar(100, 200)
      await expect.poll(() => pedidosChamados(chamadas)).toBe(base + 1)

      await page.evaluate(() => window.scrollTo(0, 600))
      await page.waitForFunction(() => window.scrollY > 300)
      await puxar(100, 200)
      await page.waitForTimeout(400)
      expect(pedidosChamados(chamadas)).toBe(base + 1)

      await page.evaluate(() => window.scrollTo(0, 0))
      atraso = 1200
      await puxar(100, 200)
      await puxar(100, 200)
      await expect.poll(() => pedidosChamados(chamadas)).toBe(base + 2)
      await page.waitForTimeout(1500)
      expect(pedidosChamados(chamadas)).toBe(base + 2)
    })
  })

  test('E2E-022 estados vazio e de erro', async ({ page }) => {
    let modo: 'vazio' | 'erro' | 'ok' = 'vazio'
    await prepararRede(page, {
      sessao: true,
      respostas: { [ERP_PEDIDOS]: (route) => (modo === 'erro' ? responder(route, { erro: 'x' }, 500) : responder(route, { pedidos: modo === 'ok' ? [pedido(7)] : [] })) },
    })
    await page.goto('/pedidos')
    await expect(page.getByText('Você ainda não fez pedidos.')).toBeVisible()
    await page.getByRole('link', { name: 'Ver produtos' }).click()
    await expect(page).toHaveURL(/\/produtos$/)

    modo = 'erro'
    await page.evaluate(() => localStorage.removeItem('loja-pedidos:u-ana')) // sem cache: primeira carga
    await page.goto('/pedidos')
    await expect(page.getByText('Não conseguimos carregar seus pedidos.')).toBeVisible()
    modo = 'ok'
    await page.getByRole('button', { name: 'Tentar de novo' }).click()
    await expect(cartoes(page)).toHaveCount(1)
  })
})

test.describe('Detalhe do pedido', () => {
  const abrir = async (page: Page, pedidos: unknown[], caminho: string) => {
    const rede = await prepararRede(page, { sessao: true, respostas: { [ERP_PEDIDOS]: { corpo: { pedidos } } } })
    await page.goto(caminho)
    return rede
  }

  test('E2E-023 linha do tempo, cancelado e situação desconhecida', async ({ page }) => {
    await abrir(page, [pedido(12, { situacao: 'Impressão iniciada' }), pedido(13, { etapa: 0, situacao: 'Cancelado pelo cliente' }), pedido(14, { etapa: 9, situacao: 'Aguardando arte' })], '/pedidos/12')
    const passos = page.locator('ol.linha-tempo li')
    await expect(passos).toHaveClass(['feita', 'atual', 'pendente', 'pendente'])
    await expect(passos.nth(0)).toHaveText('Recebido')
    await expect(passos.nth(1)).toContainText('Impressão iniciada')
    await expect(page.getByRole('heading', { name: 'Pedido nº 12' }).first()).toBeVisible()
    await page.goto('/pedidos/13')
    await expect(page.getByText('Pedido cancelado')).toBeVisible()
    await expect(page.locator('ol.linha-tempo')).toHaveCount(0)
    await page.goto('/pedidos/14')
    await expect(page.getByText('Situação: Aguardando arte')).toBeVisible()
  })

  test('E2E-024 itens, recebimento, total e WhatsApp em outra aba', async ({ page }) => {
    await abrir(page, [pedido(12), pedido(99, { itens: itens(60) })], '/pedidos/12')
    await expect(page.getByText('Cartão de visita × 500')).toBeVisible()
    await expect(page.getByText('Entrega', { exact: true })).toBeVisible()
    await expect(page.getByText('Rua das Flores, 10 — Centro, Teófilo Otoni/MG')).toBeVisible()
    const zap = page.getByRole('link', { name: 'Falar no WhatsApp sobre este pedido' })
    expect(await zap.getAttribute('href')).toContain(encodeURIComponent('Olá! Quero falar sobre o pedido nº 12.'))
    await expect(zap).toHaveAttribute('target', '_blank')
    const [popup] = await Promise.all([page.waitForEvent('popup'), zap.click()])
    await popup.close()

    await page.goto('/pedidos/99')
    const longo = page.getByRole('link', { name: 'Falar no WhatsApp sobre este pedido' })
    await longo.scrollIntoViewIfNeeded()
    await expect(longo).toBeInViewport()
  })

  test('E2E-025 pedido inexistente, número inválido (sem chamar o ERP) e sem login', async ({ page }) => {
    const { chamadas } = await abrir(page, [pedido(12)], '/pedidos/999')
    await expect(page.getByText('Pedido não encontrado')).toBeVisible()
    await page.getByRole('link', { name: 'Ver meus pedidos' }).click()
    await expect(page).toHaveURL(/\/pedidos$/)
    const antes = pedidosChamados(chamadas)
    await page.goto('/pedidos/abc')
    await expect(page.getByText('Pedido não encontrado')).toBeVisible()
    expect(pedidosChamados(chamadas)).toBe(antes)

  })

  test('E2E-025b sem login em /pedidos/12: convite e retorno ao pedido', async ({ page }) => {
    await prepararRede(page, { respostas: { '/auth/v1/token': LOGIN_OK, [ERP_PEDIDOS]: { corpo: { pedidos: [pedido(12)] } } } })
    await page.goto('/pedidos/12')
    await expect(page.getByRole('heading', { name: 'Entre para ver seus pedidos' })).toBeVisible()
    await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
    await page.getByLabel('E-mail').fill('ana@exemplo.com')
    await page.locator('#senha').fill('Senha123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/pedidos\/12$/)
  })
})
