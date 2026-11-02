import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import PuxarParaAtualizar from './PuxarParaAtualizar'
import { definirMidia } from '../test/matchMedia'

const rolar = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true })

function puxar(alvo: HTMLElement, de: number, ate: number) {
  fireEvent.touchStart(alvo, { touches: [{ clientY: de }] })
  fireEvent.touchMove(alvo, { touches: [{ clientY: ate }] })
  fireEvent.touchEnd(alvo)
}

function montar(onAtualizar = vi.fn(() => Promise.resolve()), ativo = true) {
  const r = render(
    <PuxarParaAtualizar onAtualizar={onAtualizar} ativo={ativo}>
      <p>conteúdo</p>
    </PuxarParaAtualizar>,
  )
  return { ...r, onAtualizar, alvo: screen.getByText('conteúdo') }
}

describe('PuxarParaAtualizar', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'scrollY')
    definirMidia({ reduzido: false })
  })

  it('UT-178 puxar 100px no topo atualiza uma vez e mostra o indicador durante a espera', async () => {
    rolar(0)
    let terminar!: () => void
    const { alvo, onAtualizar, container } = montar(vi.fn(() => new Promise<void>((ok) => (terminar = ok))))
    act(() => puxar(alvo, 100, 200))
    expect(onAtualizar).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.puxar-indicador')).not.toBeNull()
    await act(async () => terminar())
  })

  it('UT-179 puxar menos que o limite não atualiza', () => {
    rolar(0)
    const { alvo, onAtualizar } = montar()
    act(() => puxar(alvo, 100, 140))
    expect(onAtualizar).not.toHaveBeenCalled()
  })

  it('UT-180 fora do topo não atualiza', () => {
    rolar(10)
    const { alvo, onAtualizar } = montar()
    act(() => puxar(alvo, 100, 250))
    expect(onAtualizar).not.toHaveBeenCalled()
  })

  it('UT-181 segunda puxada durante a espera não chama de novo', async () => {
    rolar(0)
    let terminar!: () => void
    const { alvo, onAtualizar } = montar(vi.fn(() => new Promise<void>((ok) => (terminar = ok))))
    act(() => puxar(alvo, 100, 200))
    act(() => puxar(alvo, 100, 200))
    expect(onAtualizar).toHaveBeenCalledTimes(1)
    await act(async () => terminar())
  })

  it('UT-182 ativo=false mostra o conteúdo e ignora o gesto', () => {
    rolar(0)
    const { alvo, onAtualizar } = montar(undefined, false)
    expect(alvo).toBeInTheDocument()
    act(() => puxar(alvo, 100, 250))
    expect(onAtualizar).not.toHaveBeenCalled()
  })

  it('UT-183 liga html.sem-ptr-nativo enquanto montado', () => {
    const { unmount } = montar()
    expect(document.documentElement).toHaveClass('sem-ptr-nativo')
    unmount()
    expect(document.documentElement).not.toHaveClass('sem-ptr-nativo')
  })

  it('UT-184 movimento reduzido: indicador sem animação', async () => {
    definirMidia({ reduzido: true })
    rolar(0)
    let terminar!: () => void
    const { alvo, container } = montar(vi.fn(() => new Promise<void>((ok) => (terminar = ok))))
    act(() => puxar(alvo, 100, 200))
    expect(container.querySelector('.puxar-indicador')).toHaveClass('sem-animacao')
    await act(async () => terminar())
  })

  it('UT-185 ao terminar, o indicador some', async () => {
    rolar(0)
    let terminar!: () => void
    const { alvo, container } = montar(vi.fn(() => new Promise<void>((ok) => (terminar = ok))))
    act(() => puxar(alvo, 100, 200))
    expect(container.querySelector('.puxar-indicador')).not.toBeNull()
    await act(async () => terminar())
    expect(container.querySelector('.puxar-indicador')).toBeNull()
  })
})
