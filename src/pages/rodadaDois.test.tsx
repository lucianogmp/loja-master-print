import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { semearCatalogo } from '../test/dados'
import { definirRpc } from '../test/fakes'

// Segunda rodada da crítica de design: WhatsApp contextual, Buscar sem resultado e níveis de título.
const flutuante = () => document.querySelector('.whatsapp-flutuante')

describe('Ajustes da crítica de design', () => {
  it.each(['/produto/produto-a', '/pedidos/12', '/conta/dados', '/atendimento'])(
    'UT-424 %s já tem atalho próprio ou formulário: sem botão flutuante',
    async (rota) => {
      semearCatalogo()
      renderComTudo({ rota })
      await waitFor(() => expect(flutuante()).toBeNull())
    },
  )

  it('UT-425 catálogo e Início mantêm o botão flutuante', async () => {
    semearCatalogo()
    renderComTudo({ rota: '/produtos' })
    await waitFor(() => expect(flutuante()).not.toBeNull())
  })

  it('UT-426 Buscar sem resultado oferece perguntar no WhatsApp com o termo', async () => {
    semearCatalogo()
    renderComTudo({ rota: '/buscar?q=xyzw' })
    const link = await screen.findByRole('link', { name: 'Perguntar no WhatsApp' })
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('Procurei por "xyzw"')
  })

  it('UT-427 catálogo no computador: nome do produto é h2 logo abaixo do h1', async () => {
    semearCatalogo()
    const { container } = renderComTudo({ rota: '/produtos' }, { mobile: false })
    await screen.findByRole('heading', { level: 1, name: 'Todos os produtos' })
    await waitFor(() => expect(container.querySelectorAll('main .card-produto h2').length).toBeGreaterThan(0))
    expect(container.querySelectorAll('main .card-produto h3')).toHaveLength(0)
  })

  it('UT-428 Atendimento no celular: um só h1, o da barra de topo', async () => {
    renderComTudo({ rota: '/atendimento' })
    await screen.findByRole('heading', { name: 'Como funciona' })
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveTextContent('Atendimento')
  })

  it('UT-429 página de texto no celular: a barra mostra o nome da página e a página não repete o h1', async () => {
    definirRpc('loja_paginas', [{ slug: 'trocas', titulo: 'Trocas e devoluções', conteudo: 'Texto da página.', no_rodape: true, ordem: 1 }])
    renderComTudo({ rota: '/pagina/trocas' })
    await screen.findByText('Texto da página.')
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveTextContent('Trocas e devoluções')
  })
})
