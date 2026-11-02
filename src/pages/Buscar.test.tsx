import { describe, expect, it } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirRpc, erpFake, falharRpc, linhasCatalogo } from '../test/fakes'
import { semearCatalogo } from '../test/dados'
import { lerRecentes, salvarRecente } from '../lib/buscasRecentes'

const campo = () => screen.getByRole('searchbox', { name: 'Buscar produtos' })

function semearBanners(n: number) {
  definirRpc(
    'loja_catalogo_v2',
    linhasCatalogo(Array.from({ length: n }, (_, i) => ({ slug: `banner-${i}`, nome: `Banner ${i}` }))),
  )
}

/** Abre Buscar empilhando (como a aba faz): a partir do início. */
async function abrirBuscar() {
  const r = renderComTudo({ rota: '/' })
  await act(() => r.router.navigate('/buscar'))
  return r
}

describe('Buscar', () => {
  it('UT-247 chegando empilhado, o campo recebe o foco', async () => {
    await abrirBuscar()
    expect(campo()).toHaveFocus()
  })

  it('UT-248 voltando para /buscar?q=ban: sem foco, termo mantido e resultados à vista', async () => {
    semearBanners(3)
    const { container } = renderComTudo({ rota: '/buscar?q=ban' })
    expect(campo()).not.toHaveFocus()
    expect(campo()).toHaveValue('ban')
    await waitFor(() => expect(container.querySelectorAll('.buscar-resultados .card-produto')).toHaveLength(3))
  })

  it('UT-249 buscas recentes com Limpar', async () => {
    salvarRecente('banner')
    salvarRecente('cartão')
    const { usuario } = await abrirBuscar()
    const secao = screen.getByRole('heading', { name: 'Buscas recentes' }).closest('section')!
    expect(within(secao).getAllByRole('button').map((b) => b.textContent)).toEqual(['Limpar', 'cartão', 'banner'])
    await usuario.click(within(secao).getByRole('button', { name: 'Limpar' }))
    expect(screen.queryByRole('heading', { name: 'Buscas recentes' })).toBeNull()
    expect(lerRecentes()).toEqual([])
  })

  it('UT-250 categorias como links', async () => {
    semearCatalogo()
    await abrirBuscar()
    expect(await screen.findByRole('link', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'B' })).toBeInTheDocument()
  })

  it('UT-251 "ba" com 12 achados → 8 itens e o link para ver todos', async () => {
    semearBanners(12)
    const { usuario, container } = await abrirBuscar()
    await usuario.type(campo(), 'ba')
    await waitFor(() => expect(container.querySelectorAll('.buscar-resultados .card-produto')).toHaveLength(8))
    expect(screen.getByRole('link', { name: 'Ver todos os resultados (12)' })).toHaveAttribute('href', '/produtos?busca=ba')
  })

  it('UT-252 um caractere só → sem resultados', async () => {
    semearBanners(3)
    const { usuario, container } = await abrirBuscar()
    await usuario.type(campo(), 'b')
    expect(container.querySelector('.buscar-resultados')).toBeNull()
  })

  it('UT-253 Enter abre o catálogo filtrado e guarda a busca', async () => {
    const { usuario, router } = await abrirBuscar()
    await usuario.type(campo(), 'banner{Enter}')
    await waitFor(() => expect(router.state.location.pathname + router.state.location.search).toBe('/produtos?busca=banner'))
    expect(lerRecentes()[0]).toBe('banner')
  })

  it('UT-254 busca em branco não navega nem guarda', async () => {
    const { usuario, router } = await abrirBuscar()
    await usuario.type(campo(), '  {Enter}')
    expect(router.state.location.pathname).toBe('/buscar')
    expect(lerRecentes()).toEqual([])
  })

  it('UT-255 sem achados: mensagem e categorias continuam', async () => {
    semearCatalogo()
    const { usuario } = await abrirBuscar()
    await screen.findByRole('link', { name: 'A' })
    await usuario.type(campo(), 'zzz')
    expect(screen.getByText('Nenhum produto encontrado para "zzz"')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Categorias' })).toBeInTheDocument()
  })

  it('UT-256 catálogo carregando → esqueleto nos resultados', async () => {
    erpFake.rpc.mockImplementation((nome: string) => (nome === 'loja_catalogo_v2' ? new Promise(() => {}) : Promise.resolve({ data: null, error: null })))
    const { usuario, container } = await abrirBuscar()
    await usuario.type(campo(), 'ba')
    expect(container.querySelector('.buscar-resultados .esqueleto')).not.toBeNull()
  })

  it('UT-257 erro no catálogo → aviso e Tentar de novo recarrega', async () => {
    falharRpc('loja_catalogo_v2')
    const { usuario } = await abrirBuscar()
    await usuario.type(campo(), 'ba')
    expect(await screen.findByText(/Não foi possível carregar os produtos/)).toBeInTheDocument()
    const antes = erpFake.rpc.mock.calls.filter(([n]) => n === 'loja_catalogo_v2').length
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() => expect(erpFake.rpc.mock.calls.filter(([n]) => n === 'loja_catalogo_v2').length).toBe(antes + 1))
  })

  it('UT-258 resultado abre o produto', async () => {
    semearBanners(2)
    const { usuario, router } = await abrirBuscar()
    await usuario.type(campo(), 'ba')
    await usuario.click(await screen.findByRole('link', { name: /Produto Banner 0/ }))
    expect(router.state.location.pathname).toBe('/produto/produto-banner-0')
  })

  it('UT-259 categoria abre o catálogo filtrado', async () => {
    semearCatalogo()
    const { usuario, router } = await abrirBuscar()
    await usuario.click(await screen.findByRole('link', { name: 'B' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/produtos?categoria=b')
  })

  it('UT-260 primeiro caractere empilha, os seguintes só trocam ?q=', async () => {
    const { usuario, router } = await abrirBuscar()
    await usuario.type(campo(), 'b')
    expect(router.state.location.search).toBe('?q=b')
    await usuario.type(campo(), 'a')
    expect(router.state.location.search).toBe('?q=ba')
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname + router.state.location.search).toBe('/buscar')
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/')
  })

  it('UT-261 sem categorias → sem o título Categorias', async () => {
    definirRpc('loja_catalogo_v2', [])
    await abrirBuscar()
    await waitFor(() => expect(erpFake.rpc).toHaveBeenCalledWith('loja_catalogo_v2'))
    expect(screen.queryByRole('heading', { name: 'Categorias' })).toBeNull()
  })

  it('UT-262 busca recente de 150 caracteres: 100 + reticências, texto inteiro no title', async () => {
    const longo = 'x'.repeat(150)
    salvarRecente(longo)
    await abrirBuscar()
    const botao = screen.getByTitle(longo)
    expect(botao.textContent).toBe(`${'x'.repeat(100)}…`)
  })

  it('UT-263 digitar rápido: os resultados são só os do último texto', async () => {
    definirRpc('loja_catalogo_v2', linhasCatalogo([{ slug: 'ba', nome: 'Bacia' }, { slug: 'bn', nome: 'Banner' }]))
    const { usuario } = await abrirBuscar()
    await usuario.type(campo(), 'banner')
    expect(await screen.findByRole('link', { name: /Produto Banner/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Produto Bacia/ })).toBeNull()
  })

  it('limpar e redigitar não empilha outra entrada: uma só entrada extra por visita', async () => {
    const { usuario, router } = await abrirBuscar()
    await usuario.type(campo(), 'ab')
    await usuario.clear(campo())
    await usuario.type(campo(), 'cd')
    expect(router.state.location.search).toBe('?q=cd')
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname + router.state.location.search).toBe('/buscar')
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/')
  })

  it('IT-018 busca, Enter, voltar: termo mantido sem foco e salvo nas recentes', async () => {
    semearBanners(3)
    const { usuario, router } = await abrirBuscar()
    await usuario.type(campo(), 'banner')
    expect(await screen.findAllByRole('link', { name: /Produto Banner/ })).not.toHaveLength(0)
    await usuario.keyboard('{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe('/produtos'))
    expect(router.state.location.search).toBe('?busca=banner')
    await act(() => router.navigate(-1))
    await waitFor(() => expect(router.state.location.pathname).toBe('/buscar'))
    expect(router.state.location.search).toBe('?q=banner')
    expect(campo()).toHaveValue('banner')
    expect(campo()).not.toHaveFocus()
    expect(lerRecentes()).toEqual(['banner'])
  })
})

