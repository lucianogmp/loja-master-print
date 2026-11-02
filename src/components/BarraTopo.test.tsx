import { describe, expect, it } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirRpc, supabaseFake } from '../test/fakes'
import { logada } from '../test/dados'
import { useTitulo } from '../lib/telas'

const topo = (c: HTMLElement) => c.querySelector('header.barra-topo-app') as HTMLElement

function Titulada({ titulo }: { titulo: string }) {
  useTitulo(titulo)
  return <p>Corpo</p>
}
const rotaTitulada = (titulo: string) => [{ path: 'tit', element: <Titulada titulo={titulo} />, handle: { nivel: 'sub' as const, aba: 'buscar' as const, titulo: 'Fixo' } }]

describe('BarraTopo', () => {
  it('UT-112 raiz sem login: menu, logo, busca e Entrar', async () => {
    const { container } = renderComTudo({ rota: '/' })
    const t = within(topo(container))
    expect(t.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument()
    expect(t.getByRole('link', { name: /página inicial/ })).toHaveAttribute('href', '/')
    const busca = t.getByRole('link', { name: 'Buscar' })
    expect(busca).toHaveAttribute('href', '/buscar')
    expect(busca.querySelector('svg')).not.toBeNull()
    const entrar = await t.findByRole('link', { name: 'Entrar' })
    expect(entrar).toHaveAttribute('href', '/entrar?voltar=%2F')
    expect(entrar.querySelector('svg')).not.toBeNull()
  })

  it('UT-113 com login: avatar levando para /conta', async () => {
    const { container } = renderComTudo({ rota: '/' }, { sessao: logada() })
    const conta = await within(topo(container)).findByRole('link', { name: 'Minha conta' })
    expect(conta).toHaveAttribute('href', '/conta')
    expect(conta.querySelector('.avatar-p')).toHaveTextContent('AS')
  })

  it('UT-114 na raiz de Buscar não há atalho de busca', () => {
    const { container } = renderComTudo({ rota: '/buscar' })
    expect(within(topo(container)).queryByRole('link', { name: 'Buscar' })).toBeNull()
  })

  it('UT-115 subpágina: voltar e título, sem botão de menu', () => {
    const { container } = renderComTudo({ rota: '/conta/dados' }, )
    const t = within(topo(container))
    expect(t.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    expect(t.getByRole('heading', { level: 1 })).toHaveTextContent('Meus dados')
    expect(t.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
  })

  it('UT-116 a página troca o título com useTitulo', () => {
    const { container } = renderComTudo({ rota: '/tit' }, { rotasExtras: rotaTitulada('Banner 1x1') })
    expect(topo(container).querySelector('h1')).toHaveTextContent('Banner 1x1')
  })

  it('UT-117 voltar leva à entrada anterior da loja', async () => {
    const { container, router, usuario } = renderComTudo({ rota: '/' }, { historico: ['/', '/conta/dados'] })
    await usuario.click(within(topo(container)).getByRole('button', { name: 'Voltar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('UT-118 sem entrada anterior, voltar abre a raiz da aba dona', async () => {
    const { container, router, usuario } = renderComTudo({ rota: '/' }, { historico: ['/pedidos/7'] })
    await usuario.click(within(topo(container)).getByRole('button', { name: 'Voltar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pedidos'))
  })

  it('UT-119 sem logo configurado, mostra o nome da loja', () => {
    const { container } = renderComTudo({ rota: '/' })
    expect(topo(container).querySelector('.marca-texto')).toHaveTextContent('MASTER PRINT')
  })

  it('UT-120 título de 200 caracteres: texto inteiro no title e classe de corte', () => {
    const longo = 'T'.repeat(200)
    const { container } = renderComTudo({ rota: '/tit' }, { rotasExtras: rotaTitulada(longo) })
    const h1 = topo(container).querySelector('h1.barra-titulo')!
    expect(h1).toHaveAttribute('title', longo)
    expect(h1).toHaveTextContent(longo)
  })

  it('UT-121 sessão carregando: nem avatar nem Entrar, só o espaço neutro', async () => {
    supabaseFake.auth.getSession.mockImplementationOnce(() => new Promise(() => {}))
    const { container } = renderComTudo({ rota: '/' })
    const t = topo(container)
    expect(t.querySelector('.avatar-espera')).not.toBeNull()
    expect(within(t).queryByRole('link', { name: 'Entrar' })).toBeNull()
    expect(t.querySelector('.avatar-p:not(.avatar-espera)')).toBeNull()
  })

  it('UT-122 um único h1 na barra da subpágina e nenhum na da raiz', () => {
    const sub = renderComTudo({ rota: '/tit' }, { rotasExtras: rotaTitulada('X') })
    expect(topo(sub.container).querySelectorAll('h1')).toHaveLength(1)
    sub.unmount()
    const raiz = renderComTudo({ rota: '/' })
    expect(topo(raiz.container).querySelectorAll('h1')).toHaveLength(0)
  })

  it('UT-376 logo que não carrega → nome da loja no lugar', async () => {
    definirRpc('loja_config', { aparencia: { logo: 'https://x.teste/logo.png', logoEscuro: '' } })
    const { container } = renderComTudo({ rota: '/' })
    const img = await waitFor(() => {
      const el = topo(container).querySelector('img.logo-fundo-escuro') as HTMLImageElement
      expect(el).not.toBeNull()
      return el
    })
    act(() => void fireEvent.error(img))
    expect(topo(container).querySelector('.marca-texto')).not.toBeNull()
  })
})

