import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { logada } from '../test/dados'
import { supabaseFake } from '../test/fakes'
import { useAuth } from '../lib/auth'
import RequerSessao from './RequerSessao'

const ui = <RequerSessao><p>Conteúdo</p></RequerSessao>

describe('RequerSessao', () => {
  it('UT-186 carregando → espera, sem botão Entrar', () => {
    supabaseFake.auth.getSession.mockImplementationOnce(() => new Promise(() => {}))
    const { container } = renderComTudo(ui)
    expect(container.querySelector('.sessao-espera')).not.toBeNull()
    expect(screen.queryByRole('link', { name: 'Entrar' })).toBeNull()
  })

  it('UT-187 /pedidos deslogado', async () => {
    renderComTudo(ui, { historico: ['/pedidos'] })
    expect(await screen.findByText('Entre para ver seus pedidos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fpedidos')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro?voltar=%2Fpedidos')
  })

  it('UT-188 /conta deslogado', async () => {
    renderComTudo(ui, { historico: ['/conta'] })
    expect(await screen.findByText('Entre para acessar sua conta')).toBeInTheDocument()
  })

  it('UT-189 sessão expirada → mensagem e um único Entrar', async () => {
    function Expirar() {
      const { marcarSessaoExpirada } = useAuth()
      return <button onClick={() => void marcarSessaoExpirada()}>expirar</button>
    }
    const { usuario } = renderComTudo(
      <>
        <Expirar />
        {ui}
      </>,
      { sessao: logada(), historico: ['/conta'] },
    )
    await usuario.click(await screen.findByRole('button', { name: 'expirar' }))
    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Entrar' })).toHaveLength(1)
    expect(screen.queryByRole('link', { name: 'Criar conta' })).toBeNull()
  })

  it('UT-190 logada → filhos', async () => {
    renderComTudo(ui, { sessao: logada() })
    expect(await screen.findByText('Conteúdo')).toBeInTheDocument()
  })

  it('UT-191 voltar leva caminho + busca', async () => {
    renderComTudo(ui, { historico: ['/pedidos/7?x=1'] })
    await waitFor(() => expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fpedidos%2F7%3Fx%3D1'))
  })
})
