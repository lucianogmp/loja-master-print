import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import DicaInstalar from './DicaInstalar'
import { renderComTudo } from '../test/render'
import { semearCatalogo } from '../test/dados'
import { logada } from '../test/dados'
import { definirMidia } from '../test/matchMedia'
import { definirUserAgent, dispararInstalacao, UA_INSTAGRAM, UA_IPHONE } from '../test/instalacao'

afterEach(() => vi.restoreAllMocks())

const cartao = () => renderComTudo(<DicaInstalar variante="cartao" />, { casca: false })

describe('DicaInstalar', () => {
  it('UT-331 instalado: nada', () => {
    definirMidia({ standalone: true })
    const { container } = cartao()
    expect(container.querySelector('.dica-instalar')).toBeNull()
  })

  it('UT-332 dispensada: nada', () => {
    localStorage.setItem('loja-dica-instalar', JSON.stringify({ v: 1, dispensadaEm: new Date().toISOString() }))
    expect(cartao().container.querySelector('.dica-instalar')).toBeNull()
  })

  it('UT-333 computador: nada', () => {
    const { container } = renderComTudo(<DicaInstalar variante="cartao" />, { mobile: false })
    expect(container.querySelector('.dica-instalar')).toBeNull()
  })

  it('UT-334 pedido nativo aceito: some', async () => {
    dispararInstalacao('accepted')
    const { usuario, container } = cartao()
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar' }))
    await waitFor(() => expect(container.querySelector('.dica-instalar')).toBeNull())
  })

  it('UT-335 iPhone: folha com os dois passos e fechar', async () => {
    definirUserAgent(UA_IPHONE)
    const { usuario } = cartao()
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar' }))
    const folha = screen.getByRole('dialog', { name: /tela inicial/ })
    expect(folha).toHaveTextContent('Toque em Compartilhar')
    expect(folha).toHaveTextContent('Adicionar à Tela de Início')
    await usuario.click(within(folha).getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('UT-336 navegador embutido: linha extra', async () => {
    definirUserAgent(UA_INSTAGRAM)
    const { usuario } = cartao()
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Abra no navegador do aparelho para instalar')
  })

  it('UT-337 Agora não: some e grava a dispensa', async () => {
    const { usuario, container } = cartao()
    await usuario.click(await screen.findByRole('button', { name: 'Agora não' }))
    expect(container.querySelector('.dica-instalar')).toBeNull()
    expect(localStorage.getItem('loja-dica-instalar')).toContain('dispensadaEm')
  })

  it('folha: foco no Fechar, Escape fecha, fundo fecha e o foco volta ao Adicionar', async () => {
    const { usuario } = cartao()
    const adicionar = await screen.findByRole('button', { name: 'Adicionar' })
    await usuario.click(adicionar)
    const folha = screen.getByRole('dialog', { name: /tela inicial/ })
    expect(folha).toHaveAttribute('aria-modal', 'true')
    expect(within(folha).getByRole('button', { name: 'Fechar' })).toHaveFocus()
    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(adicionar).toHaveFocus()
    await usuario.click(adicionar)
    await usuario.click(document.querySelector('.folha-fundo') as HTMLElement)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('UT-338 pedido recusado: a dica continua', async () => {
    dispararInstalacao('dismissed')
    const { usuario } = cartao()
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar' }))
    expect(screen.getByText('Adicione à tela inicial')).toBeInTheDocument()
  })

  it('UT-150 menu: cartão entre Preferências e Sair', async () => {
    semearCatalogo()
    const r = renderComTudo({ rota: '/' }, { sessao: logada() })
    await r.usuario.click(await screen.findByRole('button', { name: 'Abrir menu' }))
    const menu = await screen.findByRole('dialog', { name: 'Menu' })
    const dica = menu.querySelector('.dica-instalar') as HTMLElement
    expect(dica).not.toBeNull()
    const prefs = menu.querySelector('.drawer-preferencias') as HTMLElement
    const sair = within(menu).getByRole('button', { name: 'Sair' })
    expect(prefs.compareDocumentPosition(dica) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(dica.compareDocumentPosition(sair) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('UT-304 hub: linha antes de Sair', async () => {
    renderComTudo({ rota: '/conta' }, { sessao: logada() })
    const linha = await screen.findByRole('button', { name: 'Adicionar à tela inicial' })
    const sair = screen.getByRole('button', { name: 'Sair' })
    expect(linha.compareDocumentPosition(sair) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('IT-023 evento antes da tela: cartão, pedido nativo, some do menu e do hub', async () => {
    semearCatalogo()
    const evento = dispararInstalacao('accepted')
    const r = renderComTudo({ rota: '/' }, { sessao: logada() })
    await r.usuario.click(await screen.findByRole('button', { name: 'Abrir menu' }))
    const menu = await screen.findByRole('dialog', { name: 'Menu' })
    expect(within(menu).getByText('Adicione à tela inicial')).toBeInTheDocument()
    await r.usuario.click(within(menu).getByRole('button', { name: 'Adicionar' }))
    expect(evento.prompt).toHaveBeenCalled()
    await waitFor(() => expect(menu.querySelector('.dica-instalar')).toBeNull())
    await act(() => r.router.navigate('/conta', { replace: true }))
    await screen.findByText('Meus pedidos')
    expect(screen.queryByRole('button', { name: 'Adicionar à tela inicial' })).toBeNull()
  })
})
