import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { definirRpc, erpFake, falharRpc, linhasCatalogo } from '../test/fakes'
import ChipsCategorias from './ChipsCategorias'

const AB = [
  { slug: 'a', nome: 'A' },
  { slug: 'b', nome: 'B' },
]

describe('ChipsCategorias', () => {
  it('UT-159 Todos + uma ficha por categoria com o endereço do filtro', async () => {
    definirRpc('loja_catalogo_v2', linhasCatalogo(AB))
    renderComTudo(<ChipsCategorias />)
    const nav = await screen.findByRole('navigation', { name: 'Categorias' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Todos', '/produtos'],
      ['A', '/produtos?categoria=a'],
      ['B', '/produtos?categoria=b'],
    ])
  })

  it('UT-160 ficha atual destacada; sem atual → Todos', async () => {
    definirRpc('loja_catalogo_v2', linhasCatalogo(AB))
    const { unmount } = renderComTudo(<ChipsCategorias atual="b" />)
    expect(await screen.findByRole('link', { name: 'B' })).toHaveClass('ativo')
    expect(screen.getByRole('link', { name: 'Todos' })).not.toHaveClass('ativo')
    unmount()

    definirRpc('loja_catalogo_v2', linhasCatalogo(AB))
    renderComTudo(<ChipsCategorias atual={undefined} />)
    await screen.findByRole('link', { name: 'B' })
    expect(screen.getByRole('link', { name: 'Todos' })).toHaveClass('ativo')
    expect(screen.getByRole('link', { name: 'B' })).not.toHaveClass('ativo')
  })

  it('UT-161 sem categorias (ou erro do catálogo) → nada', async () => {
    const { container } = renderComTudo(<ChipsCategorias />)
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.chips')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('UT-161 erro do catálogo → nada', async () => {
    falharRpc('loja_catalogo_v2')
    const { container } = renderComTudo(<ChipsCategorias />)
    await waitFor(() => expect(erpFake.rpc).toHaveBeenCalledWith('loja_catalogo_v2'))
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.chips')).toBeNull()
  })

  it('UT-162 a ficha ativa rola para a vista ao montar', async () => {
    definirRpc('loja_catalogo_v2', linhasCatalogo(AB))
    const rolar = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderComTudo(<ChipsCategorias atual="b" />)
    const b = await screen.findByRole('link', { name: 'B' })
    expect(rolar).toHaveBeenCalledWith(expect.objectContaining({ inline: 'nearest' }))
    expect(rolar.mock.contexts.at(-1)).toBe(b)
  })
})
