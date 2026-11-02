import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { Link, useNavegar } from './Link'

const navigateEspiao = vi.fn()
vi.mock('react-router-dom', async (original) => {
  const rr = await original<typeof import('react-router-dom')>()
  return {
    ...rr,
    // Só o teste de useNavegar troca o navigate; os demais usam o de verdade
    useNavigate: () => {
      const real = rr.useNavigate()
      return (...args: Parameters<typeof real>) => {
        navigateEspiao(...args)
        return (real as (...a: unknown[]) => unknown)(...args)
      }
    },
  }
})

function stubTransicao() {
  const iniciar = vi.fn((cb: () => unknown) => {
    const pronto = Promise.resolve(cb()).then(() => undefined)
    return { finished: pronto, ready: pronto, updateCallbackDone: pronto, skipTransition: () => {} }
  })
  Object.defineProperty(document, 'startViewTransition', { value: iniciar, configurable: true })
  return iniciar
}

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
  navigateEspiao.mockClear()
})

describe('Link / useNavegar', () => {
  it('UT-151 no celular, o link pede a transição de tela', async () => {
    const iniciar = stubTransicao()
    const { usuario, router } = renderComTudo(<Link to="/x">ir</Link>, { mobile: true })
    await usuario.click(screen.getByRole('link', { name: 'ir' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/x'))
    expect(iniciar).toHaveBeenCalled()
  })

  it('UT-152 no computador, sem transição', async () => {
    const iniciar = stubTransicao()
    const { usuario, router } = renderComTudo(<Link to="/x">ir</Link>, { mobile: false })
    await usuario.click(screen.getByRole('link', { name: 'ir' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/x'))
    expect(iniciar).not.toHaveBeenCalled()
  })

  it('UT-153 sem startViewTransition, o link ainda navega', async () => {
    expect('startViewTransition' in document).toBe(false)
    const { usuario, router } = renderComTudo(<Link to="/x">ir</Link>, { mobile: true })
    await usuario.click(screen.getByRole('link', { name: 'ir' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/x'))
  })

  function Botao({ para }: { para: string | number }) {
    const navegar = useNavegar()
    return <button onClick={() => navegar(para)}>navegar</button>
  }

  it('UT-154 useNavegar no celular → navigate(to, { viewTransition: true })', async () => {
    const { usuario } = renderComTudo(<Botao para="/x" />, { mobile: true })
    await usuario.click(screen.getByRole('button', { name: 'navegar' }))
    expect(navigateEspiao).toHaveBeenCalledWith('/x', { viewTransition: true })
  })

  it('UT-155 useNavegar(-1) → navigate(-1) sem opções', async () => {
    const { usuario } = renderComTudo(<Botao para={-1} />, { mobile: true, historico: ['/a', '/b'] })
    await usuario.click(screen.getByRole('button', { name: 'navegar' }))
    expect(navigateEspiao).toHaveBeenCalledWith(-1)
    expect(navigateEspiao.mock.calls.at(-1)).toHaveLength(1)
  })
})
