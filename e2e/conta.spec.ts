import { expect, test, type Page, type Route } from '@playwright/test'
import { prepararRede, responder } from './rede'
import sessao from './fixtures/sessao.json' with { type: 'json' }

// Hub e subpáginas da conta, links antigos, menu lateral no computador e checkout dentro da casca.

const ERP_PEDIDOS = '/functions/v1/loja-meus-pedidos'
const LOGIN_OK = { status: 200, corpo: sessao }
const soCelular = () => test.beforeEach(({}, info) => test.skip(info.project.name !== 'celular', 'só no celular'))
const soDesktop = () => test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'só no computador'))
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegação principal' })
const historico = (page: Page) => page.evaluate(() => history.length)

const semearCarrinho = (page: Page, slugs: string[]) =>
  page.addInitScript((lista) => {
    if (sessionStorage.getItem('e2e-carrinho')) return
    sessionStorage.setItem('e2e-carrinho', '1')
    localStorage.setItem('master-print-carrinho', JSON.stringify(lista.map((slug, i) => ({ id: `i${i}`, slug, variacaoId: '', quantidade: 1, arte: 'propria', observacao: '' }))))
  }, slugs)

/** Perfil que guarda o que foi salvo (o servidor de verdade devolveria o mesmo). */
function perfilComEstado() {
  let atual = { nome: 'Ana Souza', telefone: '33999990000' }
  return (route: Route) => {
    const req = route.request()
    if (req.method() === 'GET') return responder(route, (req.headers()['accept'] ?? '').includes('vnd.pgrst.object') ? atual : [atual])
    const corpo = JSON.parse(req.postData() ?? '{}')
    atual = { nome: corpo.nome ?? atual.nome, telefone: corpo.telefone ?? atual.telefone }
    return responder(route, undefined, 201)
  }
}

type Endereco = Record<string, unknown> & { id: string; padrao: boolean }
const endereco = (i: number, padrao = false): Endereco => ({
  id: `e${i}`, apelido: null, destinatario: `Pessoa ${i}`, telefone: '33999990000', cep: '39800000',
  rua: 'Rua das Flores', numero: String(i), complemento: '', bairro: 'Centro', cidade: 'Teófilo Otoni', uf: 'MG', padrao,
})

/** Endereços que aceitam inserir, alterar e excluir de verdade durante o teste. */
function enderecosComEstado(inicial: Endereco[]) {
  let lista = [...inicial]
  return (route: Route) => {
    const req = route.request()
    const id = new URL(req.url()).searchParams.get('id')?.replace('eq.', '')
    if (req.method() === 'GET') return responder(route, [...lista].sort((a, b) => Number(b.padrao) - Number(a.padrao)))
    const corpo = req.postData() ? JSON.parse(req.postData()!) : {}
    if (req.method() === 'POST') {
      lista.push({ ...endereco(lista.length + 100), ...(Array.isArray(corpo) ? corpo[0] : corpo), id: `n${lista.length + 100}` })
      return responder(route, undefined, 201)
    }
    if (req.method() === 'PATCH') {
      lista = lista.map((e) => (e.id === id ? { ...e, ...corpo } : e))
      return responder(route, lista.filter((e) => e.id === id).map((e) => ({ id: e.id })))
    }
    lista = lista.filter((e) => e.id !== id)
    return responder(route, undefined, 204)
  }
}

test.describe('Hub e subpáginas (celular)', () => {
  soCelular()

  test('E2E-026 hub, Meus dados, Atendimento e Sair', async ({ page }) => {
    await prepararRede(page, { sessao: true, respostas: { '/rest/v1/perfis': perfilComEstado() } })
    await semearCarrinho(page, ['cartao-de-visita'])
    // a dica de instalar tem spec próprio (E2E-032): aqui só as linhas do PRD
    await page.addInitScript(() => localStorage.setItem('loja-dica-instalar', JSON.stringify({ v: 1, dispensadaEm: new Date().toISOString() })))
    page.on('dialog', () => {
      throw new Error('Nenhum aviso do navegador deveria aparecer')
    })
    await page.goto('/conta')
    const linhas = page.locator('.hub-lista li')
    await expect(linhas).toHaveText(['Meus pedidos', 'Meus dados', 'Endereços', 'Segurança', 'Privacidade', 'Atendimento', 'Sair'])
    await page.getByRole('link', { name: 'Meus dados' }).click()
    await expect(page.getByRole('heading', { name: 'Meus dados', level: 1 })).toBeVisible()
    const nome = page.getByLabel('Nome')
    await expect(nome).toHaveValue('Ana Souza')
    await nome.fill('Bia Lima')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Dados salvos.')).toBeVisible()
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/conta$/)
    await expect(page.locator('.hub-nome')).toHaveText('Bia Lima')

    // Voltar com edição não salva sai sem perguntar
    await page.getByRole('link', { name: 'Meus dados' }).click()
    await page.getByLabel('Nome').fill('Outro nome')
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/conta$/)

    await page.getByRole('link', { name: 'Atendimento' }).click()
    await expect(page).toHaveURL(/\/atendimento$/)
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/conta$/)

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
    await expect(nav(page).locator('.contador')).toBeVisible() // o carrinho continua
  })
})

test('E2E-027 endereços: limite de cinco e novo padrão ao excluir', async ({ page }) => {
  await prepararRede(page, { sessao: true, respostas: { '/rest/v1/enderecos': enderecosComEstado([endereco(1, true), endereco(2), endereco(3), endereco(4)]) } })
  page.on('dialog', (d) => d.accept())
  await page.goto('/conta/enderecos')
  await expect(page.getByText('Pessoa 4')).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar endereço' }).click()
  await page.getByLabel('CEP').fill('39800000')
  await page.getByLabel('Rua / avenida').fill('Rua Nova')
  await page.getByLabel('Número').fill('55')
  await page.getByLabel('Bairro').fill('Centro')
  await page.getByLabel('Cidade').fill('Teófilo Otoni')
  await page.getByLabel('UF').fill('MG')
  await page.getByRole('button', { name: 'Salvar endereço' }).click()
  await expect(page.getByText('Endereço salvo.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar endereço' })).toHaveCount(0)
  await expect(page.getByText('Limite de 5 endereços. Exclua um para adicionar outro.')).toBeVisible()

  await page.getByRole('button', { name: 'Excluir' }).first().click()
  await expect(page.getByText('Endereço excluído.')).toBeVisible()
  await expect(page.locator('.selo-padrao')).toHaveCount(1)
  await expect(page.locator('.admin-item').first()).toContainText('padrão')
  await expect(page.locator('.admin-item')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Adicionar endereço' })).toBeVisible()
})

test('E2E-028 segurança: senhas diferentes, troca e sair de todos os aparelhos', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  page.on('dialog', (d) => d.accept())
  await page.goto('/conta/seguranca')
  await page.getByLabel('Nova senha', { exact: true }).fill('Senha1234')
  await page.getByLabel('Repetir a nova senha').fill('Senha9999')
  await page.getByRole('button', { name: 'Trocar senha' }).click()
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible()
  await page.getByLabel('Repetir a nova senha').fill('Senha1234')
  await page.getByRole('button', { name: 'Trocar senha' }).click()
  await expect(page.getByText('Senha alterada.')).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar senha' }).first().click()
  await page.getByRole('button', { name: 'Sair de todos os aparelhos' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
})

test('E2E-029 privacidade: baixar dados e excluir a conta', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  await page.goto('/conta/privacidade')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar meus dados' }).click()])
  expect(download.suggestedFilename()).toBe('meus-dados-master-print.json')
  await expect(page.getByText(/continuam registrados na gráfica/)).toBeVisible()
  await page.getByRole('button', { name: 'Excluir minha conta' }).click()
  const confirmar = page.getByRole('button', { name: 'Excluir definitivamente' })
  await expect(confirmar).toBeDisabled()
  await page.getByLabel('Para confirmar, digite seu e-mail').fill('  ANA@exemplo.com ')
  await expect(confirmar).toBeEnabled()
  await confirmar.click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Conta excluída')).toBeVisible()
})

test('E2E-030 links antigos de /conta?aba=', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  await page.goto('/')
  const antes = await historico(page)
  await page.goto('/conta?aba=pedidos')
  await expect(page).toHaveURL(/\/pedidos$/)
  expect(await historico(page)).toBe(antes + 1) // só a navegação do próprio teste: o redirecionamento substitui
  await page.goto('/conta?aba=seguranca')
  await expect(page).toHaveURL(/\/conta\/seguranca$/)
  await page.goto('/conta?aba=zzz')
  if (test.info().project.name === 'celular') {
    await expect(page).toHaveURL(/\/conta(\?aba=zzz)?$/)
    await expect(page.locator('.hub-lista')).toBeVisible()
  } else {
    await expect(page).toHaveURL(/\/conta\/dados$/)
  }
})

test.describe('Computador', () => {
  soDesktop()

  test('E2E-036 menu lateral fixo ao lado dos pedidos e da conta', async ({ page }) => {
    const pedidos = [{ numero: 12, data: '2026-03-15T15:00:00Z', total: 50, etapa: 2, situacao: 'Em produção', recebimento: 'Retirar na gráfica', endereco: '', itens: [{ descricao: 'Cartão', quantidade: 1, preco_unitario: 50, total: 50 }] }]
    await prepararRede(page, {
      sessao: true,
      respostas: { [ERP_PEDIDOS]: { corpo: { pedidos } }, '/rest/v1/enderecos': { corpo: Array.from({ length: 12 }, (_, i) => ({ ...endereco(i + 1, i === 0), rua: 'Avenida muito comprida '.repeat(3) })) } },
    })
    await page.goto('/pedidos')
    const menu = page.getByRole('navigation', { name: 'Minha conta' })
    await expect(menu.getByRole('link')).toHaveText(['Meus pedidos', 'Meus dados', 'Endereços', 'Segurança', 'Privacidade'])
    await menu.getByRole('link', { name: 'Endereços' }).click()
    await expect(page).toHaveURL(/\/conta\/enderecos$/)
    await expect(menu.getByRole('link', { name: 'Endereços' })).toHaveAttribute('aria-current', 'page')

    // o conteúdo rola e o menu fica parado
    await expect(page.getByText('Pessoa 12')).toBeVisible()
    const topo = () => menu.evaluate((e) => Math.round(e.getBoundingClientRect().top))
    await page.evaluate(() => window.scrollTo(0, 300))
    await page.waitForFunction(() => window.scrollY >= 299)
    const a = await topo()
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForFunction(() => window.scrollY >= 599)
    expect(await topo()).toBe(a)

    await page.goto('/conta')
    await expect(page).toHaveURL(/\/conta\/dados$/)
    await page.goto('/pedidos/12')
    await page.getByRole('link', { name: /Voltar para meus pedidos/ }).click()
    await expect(page).toHaveURL(/\/pedidos$/)
  })
})

test.describe('Checkout na casca (celular)', () => {
  soCelular()

  test('E2E-037 checkout sem barra, entrar, enviar e ver os pedidos', async ({ page }) => {
    let criados = 0
    const pedidos: unknown[] = []
    const { chamadas } = await prepararRede(page, {
      respostas: {
        '/auth/v1/token': LOGIN_OK,
        '/functions/v1/loja-criar-pedido': (route) => {
          if (route.request().postData() === '{}') return responder(route, {})
          criados++
          pedidos.push({ numero: 50, data: '2026-03-15T15:00:00Z', total: 15, etapa: 1, situacao: 'Recebido', recebimento: 'Retirar na gráfica', endereco: '', itens: [{ descricao: 'Cartão de visita', quantidade: 1, preco_unitario: 15, total: 15 }] })
          return responder(route, { numero: 50, total: 15 })
        },
        [ERP_PEDIDOS]: (route) => responder(route, { pedidos }),
      },
    })
    await semearCarrinho(page, ['cartao-de-visita'])
    await page.goto('/carrinho')
    await page.getByRole('link', { name: 'Finalizar pedido' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('.barra-titulo')).toHaveText('Finalizar pedido')
    await expect(nav(page)).toHaveCount(0)
    await expect(page.locator('.whatsapp-flutuante')).toHaveCount(0)

    await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/entrar\?voltar=(%2F|\/)checkout/)
    await page.getByLabel('E-mail').fill('ana@exemplo.com')
    await page.locator('#senha').fill('Senha123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout$/)

    await page.getByRole('button', { name: 'Enviar pedido' }).click()
    await expect(page.getByRole('heading', { name: 'Pedido nº 50 recebido!' })).toBeVisible()
    await page.getByRole('link', { name: 'Ver meus pedidos' }).click()
    await expect(page).toHaveURL(/\/pedidos$/)
    await expect(page.getByText('Pedido nº 50')).toBeVisible()

    // voltar até o carrinho: ele está vazio e nada é enviado de novo
    for (let i = 0; i < 4 && !/\/carrinho$/.test(page.url()); i++) await page.goBack()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    expect(criados).toBe(1)
    expect(chamadas.filter((c) => c.url.endsWith('loja-criar-pedido') && c.metodo === 'POST').length).toBeGreaterThanOrEqual(1)
    await expect(nav(page).locator('.contador')).toHaveCount(0)
  })
})

test('E2E-039 trocar de tamanho de janela mantém a rota, fecha a gaveta e troca o menu da conta', async ({ page }) => {
  await prepararRede(page, { sessao: true })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/produtos?categoria=cartoes')
  await expect(page.locator('header.header')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(page.locator('.barra-topo-app')).toBeVisible()
  await expect(page).toHaveURL(/\/produtos\?categoria=cartoes$/)

  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('header.header')).toBeVisible()

  await page.goto('/conta/enderecos')
  await expect(page.getByRole('navigation', { name: 'Minha conta' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(page.getByRole('navigation', { name: 'Minha conta' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible()
  await expect(page).toHaveURL(/\/conta\/enderecos$/)
})
