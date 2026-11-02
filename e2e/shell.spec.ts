import { expect, test, type Page } from '@playwright/test'
import { prepararRede } from './rede'
import config from './fixtures/config.json' with { type: 'json' }

// Casca do celular: barras, menu lateral, Buscar, transições, voltar, WhatsApp, fichas e mensagem de atendimento.
// Pedidos e as subpáginas da conta ganham tela própria em outra tarefa: aqui as jornadas usam /atendimento (aba Conta) no lugar.

test.beforeEach(({}, info) => test.skip(info.project.name !== 'celular', 'só no celular'))

const barraInferior = (page: Page) => page.getByRole('navigation', { name: 'Navegação principal' })
const barraTopo = (page: Page) => page.locator('header.barra-topo-app')
const semearCarrinho = (page: Page, slugs: string[]) =>
  page.addInitScript((lista) => {
    if (sessionStorage.getItem('e2e-carrinho')) return
    sessionStorage.setItem('e2e-carrinho', '1')
    localStorage.setItem(
      'master-print-carrinho',
      JSON.stringify(lista.map((slug, i) => ({ id: `i${i}`, slug, variacaoId: '', quantidade: 1, arte: 'propria', observacao: '' }))),
    )
  }, slugs)
const historico = (page: Page) => page.evaluate(() => history.length)
const transicao = (page: Page) => page.evaluate(() => document.documentElement.dataset.transicao)

test('E2E-001 barra inferior: cinco itens, alvos de 44px, conteúdo acima dela; ausente em checkout, login e admin', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  await semearCarrinho(page, ['cartao-de-visita'])
  await page.goto('/')
  const itens = barraInferior(page).getByRole('link')
  await expect(itens).toHaveCount(5)
  for (const item of await itens.all()) {
    const caixa = (await item.boundingBox())!
    expect(caixa.height).toBeGreaterThanOrEqual(44)
    const rotulo = item.locator('.aba-rotulo')
    const { altura, linha } = await rotulo.evaluate((el) => ({ altura: el.getBoundingClientRect().height, linha: parseFloat(getComputedStyle(el).lineHeight) || 16 }))
    expect(altura).toBeLessThanOrEqual(linha * 1.5)
  }
  await page.mouse.wheel(0, 100000)
  await expect.poll(() => page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2)).toBe(true)
  const topoBarra = (await barraInferior(page).boundingBox())!.y
  const cartoes = page.locator('.card-produto')
  const ultimo = (await cartoes.last().boundingBox())!
  expect(ultimo.y + ultimo.height).toBeLessThanOrEqual(topoBarra)

  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Finalizar pedido' }).first()).toBeVisible()
  await expect(barraInferior(page)).toHaveCount(0)

  // Sem login (logado, /entrar levaria para a conta)
  const anonima = await page.context().browser()!.newPage()
  await prepararRede(anonima)
  for (const caminho of ['/entrar', '/admin']) {
    await anonima.goto(caminho)
    await expect(anonima.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(barraInferior(anonima)).toHaveCount(0)
  }
})

test('E2E-002 contador do carrinho: adiciona, 9+, remove tudo, primeiro quadro já com o número', async ({ page }) => {
  await prepararRede(page)
  // Entra pela vitrine: abrindo a página do produto direto, a variação só vem depois do catálogo e o botão fica desabilitado
  await page.goto('/')
  await page.locator('.card-produto', { hasText: 'Banner 1x1' }).first().click()
  await page.getByRole('button', { name: /Adicionar ao carrinho/ }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(barraInferior(page).locator('.contador')).toHaveText('1')

  const slugs = ['cartao-de-visita', 'cartao-premium', 'cartao-fidelidade', 'banner-1x1', 'banner-2x1', 'faixa-de-lona', 'adesivo-redondo', 'adesivo-vinil', 'placa-acm', 'placa-pvc']
  await page.evaluate((lista) => {
    localStorage.setItem('master-print-carrinho', JSON.stringify(lista.map((slug, i) => ({ id: `i${i}`, slug, variacaoId: '', quantidade: 1, arte: 'propria', observacao: '' }))))
  }, slugs)
  await page.reload()
  await expect(barraInferior(page).locator('.contador')).toHaveText('9+')

  const remover = page.getByRole('button', { name: 'Remover' })
  while ((await remover.count()) > 0) await remover.first().click()
  await expect(barraInferior(page).locator('.contador')).toHaveCount(0)

  await page.evaluate(() => {
    localStorage.setItem('master-print-carrinho', JSON.stringify(['cartao-de-visita', 'banner-1x1'].map((slug, i) => ({ id: `r${i}`, slug, variacaoId: '', quantidade: 1, arte: 'propria', observacao: '' }))))
  })
  await page.goto('/', { waitUntil: 'commit' })
  await expect(barraInferior(page).locator('.contador')).toHaveText('2')
})

test('E2E-003 abas: dona da tela, toque na ativa sobe ao topo, toque duplo abre uma vez', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  await page.goto('/atendimento')
  const conta = barraInferior(page).getByRole('link', { name: 'Conta' })
  await expect(conta).toHaveAttribute('aria-current', 'page')
  await conta.click()
  await expect(page).toHaveURL(/\/conta$/)
  await page.evaluate(() => window.scrollTo(0, 300))
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Conta' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

  await page.goto('/')
  const antes = await historico(page)
  await barraInferior(page).getByRole('link', { name: 'Buscar' }).dblclick()
  await expect(page).toHaveURL(/\/buscar$/)
  expect((await historico(page)) - antes).toBe(1)
})

test('E2E-004 barra do alto: raiz com menu, logo, busca e Entrar; subpágina com voltar e título', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  await expect(barraTopo(page).getByRole('button', { name: 'Abrir menu' })).toBeVisible()
  await expect(barraTopo(page).getByRole('link', { name: /página inicial/ })).toBeVisible()
  await expect(barraTopo(page).getByRole('link', { name: 'Buscar' })).toBeVisible()
  await expect(barraTopo(page).getByRole('link', { name: 'Entrar' })).toBeVisible()

  await page.goto('/produto/banner-1x1')
  await expect(barraTopo(page).getByRole('button', { name: 'Voltar' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Banner 1x1')

  await page.goto('/produtos?categoria=cartoes')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cartões de visita')
  await page.mouse.wheel(0, 800)
  await expect(barraTopo(page)).toBeInViewport()
  const alfa = await barraTopo(page).evaluate((el) => {
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)!.map(Number)
    return m.length === 4 ? m[3] : 1
  })
  expect(alfa).toBeGreaterThan(0.9)
})

test('E2E-004 logado: avatar na barra; nome longo da loja é cortado', async ({ page }) => {
  await prepararRede(page, {
    sessao: true,
    respostas: { '/rest/v1/rpc/loja_config': { corpo: { ...config, empresa: { ...config.empresa, nome: 'Gráfica Master Print Comunicação Visual e Impressos Rápidos Ltda' } } } },
  })
  await page.goto('/')
  await expect(barraTopo(page).getByRole('link', { name: 'Minha conta' }).locator('.avatar-p')).toHaveText('AS')
  const texto = barraTopo(page).locator('.marca-texto strong')
  await expect(texto).toContainText('GRÁFICA')
  expect(await texto.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
})

test('E2E-005 menu lateral: trava a rolagem, fecha de todos os jeitos, foco volta, rola por dentro', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  const abrir = barraTopo(page).getByRole('button', { name: 'Abrir menu' })
  const menu = page.getByRole('dialog', { name: 'Menu' })

  await abrir.click()
  await expect(menu).toBeVisible()
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden')
  await page.mouse.wheel(0, 500)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  const alvo = (await barraInferior(page).getByRole('link', { name: 'Conta' }).boundingBox())!
  const quem = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className, { x: alvo.x + alvo.width / 2, y: alvo.y + alvo.height / 2 })
  expect(String(quem)).toContain('drawer-fundo')

  await page.locator('.drawer-fundo').click({ position: { x: 360, y: 400 } })
  await expect(menu).toBeHidden()
  await expect(abrir).toBeFocused()

  await abrir.click()
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()

  await abrir.click()
  await expect(menu).toBeVisible()
  await page.waitForTimeout(400) // painel termina de deslizar
  const painel = (await menu.boundingBox())!
  // Deslize de dedo: eventos de ponteiro do tipo toque (o arrastar do mouse sobre um link vira "arrastar e soltar" e cancela o gesto)
  await page.locator('.drawer-painel').evaluate((el, { x, y }) => {
    const evento = (tipo: string, cx: number) => el.dispatchEvent(new PointerEvent(tipo, { bubbles: true, pointerType: 'touch', pointerId: 7, clientX: cx, clientY: y }))
    evento('pointerdown', x)
    evento('pointermove', x - 60)
    evento('pointerup', x - 120)
  }, { x: painel.x + painel.width - 20, y: 300 })
  await expect(menu).toBeHidden()

  await abrir.click()
  await expect(menu).toBeVisible()
  const url = page.url()
  await page.goBack()
  await expect(menu).toBeHidden()
  expect(page.url()).toBe(url)

  await abrir.click()
  await expect(menu).toBeVisible()
  const duracao = await page.locator('.drawer-painel').evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(duracao).not.toBe('0s')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await page.locator('.drawer-painel').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')
})

test('E2E-005 menu com 40 categorias rola por dentro', async ({ page }) => {
  const linhas = Array.from({ length: 40 }, (_, i) => ({
    id: `c${i}`, slug: `cat-${i}`, nome: `Produto ${i}`, categoria: `Categoria ${i}`, categoria_original: `cat-${i}`, categoria_imagem: null,
    categoria_ordem: i, por_metro_quadrado: false, preco: 10, prazo_entrega_dias: 3, descricao_publica: null, imagens: [],
    peso_kg: null, comprimento_cm: null, largura_cm: null, altura_cm: null, entrega_modo: 'envio_e_retirada', destaque: false, ordem: i,
  }))
  await prepararRede(page, { respostas: { '/rest/v1/rpc/loja_catalogo_v2': { corpo: linhas } } })
  await page.goto('/')
  await barraTopo(page).getByRole('button', { name: 'Abrir menu' }).click()
  const painel = page.locator('.drawer-painel')
  await expect(painel.getByRole('link', { name: 'Categoria 39' })).toBeAttached()
  expect(await painel.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
})

test('E2E-006 conteúdo do menu na ordem, entrar/criar conta, categorias sem empilhar histórico', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  await barraTopo(page).getByRole('button', { name: 'Abrir menu' }).click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Criar conta' })).toBeVisible()
  const titulos = await menu.getByRole('heading', { level: 2 }).allTextContents()
  expect(titulos).toEqual(['Categorias', 'Loja', 'Atendimento', 'Preferências'])
  await expect(menu.getByRole('link', { name: 'Todos' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Política de Privacidade' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Atendimento' })).toBeVisible()
  await expect(menu.getByText(config.empresa.horario)).toBeVisible()
  expect(await menu.getByRole('link', { name: 'Falar no WhatsApp' }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\//)
  await expect(menu.getByRole('button', { name: /Ativar tema/ })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Administração' })).toHaveCount(0)
  await expect(menu.getByRole('button', { name: 'Sair' })).toHaveCount(0)

  const antes = await historico(page)
  await menu.getByRole('link', { name: 'Cartões de visita' }).click()
  await expect(page).toHaveURL(/\/produtos\?categoria=cartoes$/)
  expect((await historico(page)) - antes).toBe(0)
  await expect(barraInferior(page).getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
})

test('E2E-006 menu logado e com administrador', async ({ page }) => {
  await prepararRede(page, { sessao: true, adminErp: true })
  await page.goto('/')
  await barraTopo(page).getByRole('button', { name: 'Abrir menu' }).click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu.locator('.drawer-usuario .avatar-m')).toHaveText('AS')
  await expect(menu.getByText('ana@exemplo.com')).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Administração' })).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Sair' })).toBeVisible()
})

test('E2E-006 título longo da barra termina em reticências', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/produto/banner-1x1')
  expect(await page.locator('h1.barra-titulo').evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis')
})

test('E2E-007 Buscar: foco, resultados, sem achados, Enter, voltar e recentes', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  await barraInferior(page).getByRole('link', { name: 'Buscar' }).click()
  const campo = page.getByRole('searchbox', { name: 'Buscar produtos' })
  await expect(campo).toBeFocused()
  await campo.fill('ca')
  expect(await page.locator('.buscar-resultados .card-produto').count()).toBeLessThanOrEqual(8)
  await expect(page.locator('.buscar-resultados .card-produto').first()).toBeVisible()

  await campo.fill('zzz')
  await expect(page.getByText('Nenhum produto encontrado para "zzz"')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Categorias' })).toBeVisible()

  await campo.fill('')
  await campo.fill('banner')
  await campo.press('Enter')
  await expect(page).toHaveURL(/\/produtos\?busca=banner$/)
  await expect(page.getByText('Resultados para “banner”')).toBeVisible() // a tela nova já está montada
  await page.goBack()
  await expect(page).toHaveURL(/\/buscar\?q=banner$/)
  await expect(campo).toHaveValue('banner')
  await expect(campo).not.toBeFocused()

  await campo.fill('')
  await expect(page.getByRole('heading', { name: 'Buscas recentes' })).toBeVisible()
  await expect(page.locator('.buscar-recentes')).toContainText('banner')
  await page.getByRole('button', { name: 'Limpar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Buscas recentes' })).toHaveCount(0)
})

test('E2E-008 transições: push, pop e nenhuma; movimento reduzido desliga as animações', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  await page.locator('.card-produto').first().click()
  await expect(page).toHaveURL(/\/produto\//)
  await expect.poll(() => transicao(page)).toBe('push')
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => transicao(page)).toBe('pop')
  await barraInferior(page).getByRole('link', { name: 'Carrinho' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect.poll(() => transicao(page)).toBe('nenhuma')

  // Com movimento reduzido, a folha de estilo zera as animações das transições de tela
  const desligadas = await page.evaluate(() =>
    [...document.styleSheets].some((folha) => {
      try {
        return [...folha.cssRules].some(
          (r) => r instanceof CSSMediaRule && r.conditionText.includes('prefers-reduced-motion') && r.cssText.includes('view-transition-old(root)') && /animation: (none|auto ease 0s 1 normal none running none)/.test(r.cssText),
        )
      } catch {
        return false // folha de outra origem (fontes)
      }
    }),
  )
  expect(desligadas).toBe(true)
})

test('E2E-009 voltar: rolagem restaurada, raiz da aba em link direto, depois de recarregar', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/produtos')
  await page.evaluate(() => window.scrollTo(0, 800))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
  const rolado = await page.evaluate(() => window.scrollY)
  // Um cartão que já está na tela (o clique do Playwright rolaria até o primeiro e perderia a posição)
  const naTela = await page.locator('.card-produto').evaluateAll((els) => els.findIndex((el) => el.getBoundingClientRect().top > 80 && el.getBoundingClientRect().bottom < window.innerHeight))
  await page.locator('.card-produto').nth(naTela).click()
  await expect(page).toHaveURL(/\/produto\//)
  await barraTopo(page).getByRole('button', { name: 'Voltar' }).click()
  await expect(page).toHaveURL(/\/produtos$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(rolado - 150)

  const novo = await page.context().newPage()
  await prepararRede(novo)
  await novo.goto('/produto/banner-1x1')
  await barraTopo(novo).getByRole('button', { name: 'Voltar' }).click()
  await expect(novo).toHaveURL(/\/buscar$/)
  await novo.goto('/atendimento')
  await novo.reload()
  await expect(novo.getByRole('heading', { name: 'Atendimento' }).first()).toBeVisible()
  await barraTopo(novo).getByRole('button', { name: 'Voltar' }).click()
  await expect(novo).toHaveURL(/\/conta$/)
})

test('E2E-010 botão do WhatsApp acima da barra; some com o menu aberto e no checkout', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  await semearCarrinho(page, ['cartao-de-visita'])
  await page.goto('/')
  const botao = page.locator('.whatsapp-flutuante')
  const b = (await botao.boundingBox())!
  const barra = (await barraInferior(page).boundingBox())!
  expect(barra.y - (b.y + b.height)).toBeGreaterThanOrEqual(11.5)
  await barraTopo(page).getByRole('button', { name: 'Abrir menu' }).click()
  await expect(botao).toHaveCount(0)
  await page.goBack()
  await page.goto('/checkout')
  await expect(botao).toHaveCount(0)
})

test('E2E-011 Início: mensagem de atendimento e fichas de categoria', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  const mensagem = page.locator('main > .mensagem-atendimento')
  await expect(mensagem).toContainText(config.empresa.horario)
  await expect(mensagem.getByRole('link', { name: 'Falar no WhatsApp' })).toBeVisible()
  const chips = page.locator('main > .chips')
  await expect(chips).toBeVisible()
  const ordem = await page.locator('main').evaluate((el) => [...el.children].slice(0, 2).map((c) => c.className))
  expect(ordem[0]).toContain('mensagem-atendimento')
  expect(ordem[1]).toContain('chips')
  expect(await chips.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  expect(await chips.evaluate((el) => el.getBoundingClientRect().height < 80)).toBe(true)

  await chips.getByRole('link', { name: 'Cartões de visita' }).click()
  await expect(page).toHaveURL(/\/produtos\?categoria=cartoes$/)
  await expect(barraInferior(page).getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.chips a.ativo')).toHaveText('Cartões de visita')
  await expect(page.locator('.chips a.ativo')).toBeInViewport()

  await page.goto('/carrinho')
  await expect(page.locator('.chips')).toHaveCount(0)
  await expect(page.locator('.mensagem-atendimento')).toHaveCount(0)
})

test('E2E-011 sem horário e sem WhatsApp configurados a mensagem some; horário longo corta em 2 linhas', async ({ page }) => {
  await prepararRede(page, { respostas: { '/rest/v1/rpc/loja_config': { corpo: { ...config, empresa: { ...config.empresa, horario: '', whatsapp: '' } } } } })
  await page.goto('/')
  await expect(page.locator('.chips')).toBeVisible()
  await expect(page.locator('.mensagem-atendimento')).toHaveCount(0)
})

test('E2E-011 horário de três linhas é cortado em duas', async ({ page }) => {
  const longo = 'Atendimento de segunda a sexta das 8h às 18h, aos sábados das 8h às 12h, fechado em feriados nacionais, estaduais e municipais, com plantão por WhatsApp'
  await prepararRede(page, { respostas: { '/rest/v1/rpc/loja_config': { corpo: { ...config, empresa: { ...config.empresa, horario: longo } } } } })
  await page.goto('/')
  const horario = page.locator('.mensagem-horario')
  await expect(horario).toContainText('Atendimento de segunda')
  const { altura, linha } = await horario.evaluate((el) => ({ altura: el.getBoundingClientRect().height, linha: parseFloat(getComputedStyle(el).lineHeight) || el.getBoundingClientRect().height }))
  expect(altura).toBeLessThanOrEqual(linha * 2 + 1)
})

test('E2E-038 Carrinho como raiz da aba: menu, vazio e remoção', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/')
  await barraInferior(page).getByRole('link', { name: 'Carrinho' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(barraTopo(page).getByRole('button', { name: 'Abrir menu' })).toBeVisible()
  await expect(barraInferior(page).getByRole('link', { name: 'Carrinho' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await page.getByRole('link', { name: 'Ver produtos' }).click()
  await expect(page).toHaveURL(/\/produtos$/)
})

test('E2E-038 Carrinho com itens: remover atualiza o contador', async ({ page }) => {
  await prepararRede(page)
  await semearCarrinho(page, ['cartao-de-visita', 'banner-1x1'])
  await page.goto('/carrinho')
  await expect(barraInferior(page).locator('.contador')).toHaveText('2')
  await page.getByRole('button', { name: 'Remover' }).first().click()
  await expect(barraInferior(page).locator('.contador')).toHaveText('1')
})

test('E2E-040 página inexistente: barra à mostra, nenhuma aba atual, voltar ao início', async ({ page }) => {
  await prepararRede(page)
  await page.goto('/nao-existe')
  await expect(barraTopo(page).getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await expect(barraInferior(page)).toBeVisible()
  await expect(barraInferior(page).locator('[aria-current]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL(/\/$/)
})
