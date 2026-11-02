import { describe, expect, it } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import { limparCachePedidos } from '../lib/pedidos'
import { renderComTudo } from '../test/render'
import { chamadasPedidos, fetchErp, logada, pedidoFalso, respostaJson, semearConfig, semearPedidos } from '../test/dados'

const nunca = () => new Promise<Response>(() => {})

/** Pedido já guardado no cache, ERP que não responde, tela aberta em /pedidos/<número>. */
function abrirPedido(p: ReturnType<typeof pedidoFalso>, opcoes: Parameters<typeof renderComTudo>[1] = {}) {
  semearPedidos('u1', [p])
  fetchErp({ 'loja-meus-pedidos': nunca })
  return renderComTudo({ rota: `/pedidos/${p.numero}` }, { sessao: logada(), ...opcoes })
}

const passos = (c: HTMLElement) => [...c.querySelectorAll('ol.linha-tempo li')]

describe('PedidoDetalhe', () => {
  it('UT-278 linha do tempo: feita, atual e pendentes conforme a etapa', async () => {
    const a = abrirPedido(pedidoFalso(12, { etapa: 2 }))
    await screen.findByRole('list', { name: 'Andamento do pedido' })
    expect(passos(a.container).map((li) => li.className)).toEqual(['feita', 'atual', 'pendente', 'pendente'])
    expect(passos(a.container).map((li) => li.querySelector('.linha-tempo-rotulo')?.textContent)).toEqual(['Recebido', 'Em produção', 'Pronto', 'Entregue'])
    a.unmount()
    const b = abrirPedido(pedidoFalso(12, { etapa: 1 }))
    await screen.findByRole('list', { name: 'Andamento do pedido' })
    expect(passos(b.container).map((li) => li.className)).toEqual(['atual', 'pendente', 'pendente', 'pendente'])
  })

  it('UT-279 situação diferente do passo aparece como nota no passo atual', async () => {
    const { container } = abrirPedido(pedidoFalso(12, { etapa: 2, situacao: 'Impressão iniciada' }))
    const nota = await screen.findByText('Impressão iniciada')
    expect(nota.closest('li')).toBe(passos(container)[1])
  })

  it('UT-280 situação igual ao passo não gera nota', async () => {
    const { container } = abrirPedido(pedidoFalso(12, { etapa: 2, situacao: 'em produção' }))
    await screen.findByRole('list', { name: 'Andamento do pedido' })
    expect(container.querySelector('.linha-tempo-nota')).toBeNull()
  })

  it('UT-281 cancelado: sem linha do tempo, com aviso e a situação', async () => {
    const { container } = abrirPedido(pedidoFalso(12, { etapa: 0, situacao: 'Cancelado a pedido do cliente' }))
    expect(await screen.findByText('Pedido cancelado')).toBeInTheDocument()
    expect(screen.getByText('Cancelado a pedido do cliente')).toBeInTheDocument()
    expect(container.querySelector('ol.linha-tempo')).toBeNull()
  })

  it('UT-282 etapa desconhecida: nenhum passo marcado e "Situação: …"', async () => {
    const { container } = abrirPedido(pedidoFalso(12, { etapa: 9, situacao: 'Aguardando arte' }))
    expect(await screen.findByText('Situação: Aguardando arte')).toBeInTheDocument()
    expect(container.querySelector('.atual, .feita')).toBeNull()
  })

  it('UT-283 situação de 300 caracteres aparece inteira', async () => {
    const longa = 'x'.repeat(300)
    abrirPedido(pedidoFalso(12, { etapa: 2, situacao: longa }))
    expect(await screen.findByText(longa)).toBeInTheDocument()
  })

  it('UT-284 situação com HTML vira texto', async () => {
    const { container } = abrirPedido(pedidoFalso(12, { etapa: 2, situacao: '<b>x</b>' }))
    expect(await screen.findByText('<b>x</b>')).toBeInTheDocument()
    expect(container.querySelector('main b')).toBeNull()
  })

  it('UT-285 itens com quantidade, preço unitário e total da linha', async () => {
    abrirPedido(pedidoFalso(12))
    expect(await screen.findByText('Cartão de visita × 500')).toBeInTheDocument()
    expect(screen.getByText('R$ 0,10')).toBeInTheDocument()
    expect(screen.getByText('R$ 50,00')).toBeInTheDocument()
  })

  it('UT-286 retirada', async () => {
    abrirPedido(pedidoFalso(12, { recebimento: 'Retirada na loja' }))
    expect(await screen.findByText('Retirar na gráfica')).toBeInTheDocument()
  })

  it('UT-287 entrega com endereço', async () => {
    abrirPedido(pedidoFalso(12, { recebimento: 'Entrega', endereco: 'Rua A, 1' }))
    expect(await screen.findByText('Entrega')).toBeInTheDocument()
    expect(screen.getByText('Rua A, 1')).toBeInTheDocument()
  })

  it('UT-288 entrega sem endereço', async () => {
    abrirPedido(pedidoFalso(12, { recebimento: 'Entrega', endereco: '' }))
    expect(await screen.findByText('Endereço a combinar')).toBeInTheDocument()
  })

  it('UT-289 recebimento desconhecido: bloco ausente', async () => {
    const { container } = abrirPedido(pedidoFalso(12, { recebimento: '???' }))
    await screen.findByText('Cartão de visita × 500')
    expect(container.querySelector('.recebimento')).toBeNull()
  })

  it('UT-290 total do pedido', async () => {
    abrirPedido(pedidoFalso(12))
    const total = (await screen.findByText('Total')).parentElement!
    expect(within(total).getByText('R$ 120,00')).toBeInTheDocument()
  })

  it('UT-291 botão do WhatsApp com a mensagem do pedido, em outra aba', async () => {
    semearConfig()
    abrirPedido(pedidoFalso(12))
    const link = await screen.findByRole('link', { name: 'Falar no WhatsApp sobre este pedido' })
    expect(link.getAttribute('href')).toContain(encodeURIComponent('Olá! Quero falar sobre o pedido nº 12.'))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('UT-292 sem número de WhatsApp não há botão', async () => {
    semearConfig({ whatsapp: '' })
    abrirPedido(pedidoFalso(12))
    await screen.findByText('Cartão de visita × 500')
    expect(screen.queryByRole('link', { name: /WhatsApp sobre este pedido/ })).toBeNull()
  })

  it('UT-293 número malformado → não encontrado, sem chamar o ERP', async () => {
    const fetchFalso = fetchErp({ 'loja-meus-pedidos': nunca })
    renderComTudo({ rota: '/pedidos/abc' }, { sessao: logada() })
    expect(await screen.findByText('Pedido não encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver meus pedidos' })).toHaveAttribute('href', '/pedidos')
    expect(chamadasPedidos(fetchFalso)).toBe(0)
  })

  it('UT-294 carregando sem cache: esqueleto, nunca "não encontrado"', async () => {
    fetchErp({ 'loja-meus-pedidos': nunca })
    const { container } = renderComTudo({ rota: '/pedidos/12' }, { sessao: logada() })
    await waitFor(() => expect(container.querySelector('.esqueleto-detalhe')).not.toBeNull())
    expect(screen.queryByText('Pedido não encontrado')).toBeNull()
  })

  it('UT-295 lista carregada sem o número → não encontrado', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [pedidoFalso(1)] }) })
    renderComTudo({ rota: '/pedidos/99' }, { sessao: logada() })
    expect(await screen.findByText('Pedido não encontrado')).toBeInTheDocument()
  })

  it('UT-296 o título da barra é "Pedido nº 12"', async () => {
    const { container } = abrirPedido(pedidoFalso(12))
    await screen.findByRole('list', { name: 'Andamento do pedido' })
    expect(container.querySelector('.barra-titulo')).toHaveTextContent('Pedido nº 12')
  })

  it('UT-297 sem itens', async () => {
    abrirPedido(pedidoFalso(12, { itens: [] }))
    expect(await screen.findByText('Sem itens')).toBeInTheDocument()
  })

  it('UT-298 item sem preço unitário: só o total da linha', async () => {
    const { container } = abrirPedido(
      pedidoFalso(12, { itens: [{ descricao: 'Arte', quantidade: 1, total: 30 } as never] }),
    )
    expect(await screen.findByText('Arte × 1')).toBeInTheDocument()
    expect(container.querySelector('.item-unitario')).toBeNull()
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument()
  })

  it('UT-382 60 itens e o botão do WhatsApp continua na página', async () => {
    semearConfig()
    const itens = Array.from({ length: 60 }, (_, i) => ({ descricao: `Item ${i + 1}`, quantidade: 1, preco_unitario: 1, total: 1 }))
    const { container } = abrirPedido(pedidoFalso(12, { itens }))
    await screen.findByText('Item 60 × 1')
    expect(container.querySelectorAll('.resumo-itens li')).toHaveLength(60)
    expect(screen.getByRole('link', { name: /WhatsApp sobre este pedido/ })).toBeInTheDocument()
  })

  it('UT-383 sem cache e ERP fora do ar: erro com Tentar de novo (não "não encontrado")', async () => {
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ erro: 'x' }, 500) })
    renderComTudo({ rota: '/pedidos/12' }, { sessao: logada() })
    expect(await screen.findByText('Não conseguimos carregar o pedido.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(screen.queryByText('Pedido não encontrado')).toBeNull()
  })

  it('UT-384 pedido some na atualização → não encontrado; atualização falha → detalhe com aviso', async () => {
    semearPedidos('u1', [pedidoFalso(12)])
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ pedidos: [pedidoFalso(13)] }) })
    const a = renderComTudo({ rota: '/pedidos/12' }, { sessao: logada() })
    expect(await screen.findByText('Pedido não encontrado')).toBeInTheDocument()
    a.unmount()

    limparCachePedidos() // esquece a busca recente, senão a segunda abertura não atualizaria
    semearPedidos('u1', [pedidoFalso(12)])
    fetchErp({ 'loja-meus-pedidos': () => respostaJson({ erro: 'x' }, 500) })
    renderComTudo({ rota: '/pedidos/12' }, { sessao: logada() })
    expect(await screen.findByText(/Não foi possível atualizar/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Andamento do pedido' })).toBeInTheDocument()
  })

  it('computador: link "Voltar para meus pedidos" (UT-324)', async () => {
    const { usuario, router } = abrirPedido(pedidoFalso(12), { mobile: false })
    const voltar = await screen.findByRole('link', { name: /Voltar para meus pedidos/ })
    expect(voltar).toHaveAttribute('href', '/pedidos')
    await usuario.click(voltar)
    await waitFor(() => expect(router.state.location.pathname).toBe('/pedidos'))
    await act(async () => {})
  })
})
