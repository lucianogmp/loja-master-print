import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Drawer from './Drawer'

function montar(props: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  const onFechar = vi.fn()
  const r = render(
    <Drawer aberto onFechar={onFechar} rotulo="Menu" {...props}>
      <a href="/a">Primeiro</a>
      <a href="/b">Segundo</a>
    </Drawer>,
  )
  return { onFechar, ...r }
}
const painel = () => screen.getByRole('dialog')
const deslizar = (de: [number, number], para: [number, number]) => {
  fireEvent.pointerDown(painel(), { clientX: de[0], clientY: de[1] })
  fireEvent.pointerUp(painel(), { clientX: para[0], clientY: para[1] })
}

describe('Drawer', () => {
  it('UT-123 fechado → nada', () => {
    const { container } = montar({ aberto: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('UT-123b ao fechar, continua montado durante a saída e sai sem interceptar toques', () => {
    vi.useFakeTimers()
    const { container, rerender } = montar()
    rerender(
      <Drawer aberto={false} onFechar={() => {}} rotulo="Menu">
        x
      </Drawer>,
    )
    expect(container.querySelector('.drawer')).toHaveClass('drawer-saindo')
    expect(container.querySelector('.drawer')).not.toHaveClass('drawer-aberto')
    act(() => void vi.advanceTimersByTime(250))
    expect(container).toBeEmptyDOMElement()
    vi.useRealTimers()
  })

  it('UT-124 aberto → diálogo modal com o nome dado', () => {
    montar()
    expect(painel()).toHaveAttribute('aria-modal', 'true')
    expect(painel()).toHaveAttribute('aria-label', 'Menu')
  })

  it('UT-125 clique no fundo fecha', async () => {
    const { onFechar, container } = montar()
    await userEvent.click(container.querySelector('.drawer-fundo')!)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('UT-126 botão Fechar menu fecha', async () => {
    const { onFechar } = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }))
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('UT-127 Escape fecha', async () => {
    const { onFechar } = montar()
    await userEvent.keyboard('{Escape}')
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('UT-128 deslizar para a esquerda fecha', () => {
    const { onFechar } = montar()
    deslizar([200, 100], [150, 105])
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('UT-129 gesto mais vertical que horizontal não fecha', () => {
    const { onFechar } = montar()
    deslizar([200, 100], [170, 220])
    expect(onFechar).not.toHaveBeenCalled()
  })

  it('UT-130 limite de 40px', () => {
    const { onFechar } = montar()
    deslizar([200, 100], [170, 100])
    expect(onFechar).not.toHaveBeenCalled()
    deslizar([200, 100], [160, 100])
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('UT-131 trava a rolagem da página enquanto aberto', () => {
    const { rerender } = montar()
    expect(document.documentElement.classList.contains('sem-rolagem')).toBe(true)
    rerender(
      <Drawer aberto={false} onFechar={() => {}} rotulo="Menu">
        x
      </Drawer>,
    )
    expect(document.documentElement.classList.contains('sem-rolagem')).toBe(false)
  })

  it('UT-132 o foco vai para dentro do painel', () => {
    montar()
    expect(painel().contains(document.activeElement)).toBe(true)
  })

  it('UT-133 ao fechar, o foco volta para quem abriu', () => {
    const botao = document.createElement('button')
    document.body.append(botao)
    const ref = createRef<HTMLElement>() as { current: HTMLElement | null }
    ref.current = botao
    const { rerender } = montar({ devolverFocoPara: ref })
    rerender(
      <Drawer aberto={false} onFechar={() => {}} rotulo="Menu" devolverFocoPara={ref}>
        x
      </Drawer>,
    )
    expect(document.activeElement).toBe(botao)
    botao.remove()
  })

  it('UT-134 Tab e Shift+Tab dão a volta dentro do painel', async () => {
    montar()
    const fechar = screen.getByRole('button', { name: 'Fechar menu' })
    const ultimo = screen.getByRole('link', { name: 'Segundo' })
    ultimo.focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(fechar)
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(ultimo)
  })
})
