import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { aplicarAparencia, contraste, type Aparencia } from './site'
import { useTheme } from '../hooks/useTheme'

const BASE = { cor: '', tituloAba: 'Loja', favicon: '', iconeApp: '' } as unknown as Aparencia

beforeEach(() => {
  document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#0f172a"><link rel="apple-touch-icon" href="/icones/icone-180.png">')
})
afterEach(() => {
  document.head.querySelectorAll('meta[name="theme-color"], link[rel="apple-touch-icon"]').forEach((e) => e.remove())
})

const toque = () => document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')

describe('chrome do aparelho', () => {
  it('UT-358 theme-color acompanha o tema', () => {
    localStorage.setItem('master-print-theme', 'dark')
    const { result } = renderHook(() => useTheme())
    const cor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
    expect(cor()).toBe('#0f172a')
    act(() => result.current.toggleTheme())
    expect(cor()).toBe('#f8fbff')
    act(() => result.current.toggleTheme())
    expect(cor()).toBe('#0f172a')
  })

  it('UT-359 ícone do administrador vale no touch icon', () => {
    aplicarAparencia({ ...BASE, iconeApp: 'https://cdn/i.png' })
    expect(toque()?.getAttribute('href')).toBe('https://cdn/i.png')
  })

  it('UT-360 sem ícone volta ao padrão e o elemento fica', () => {
    aplicarAparencia({ ...BASE, iconeApp: 'https://cdn/i.png' })
    const el = toque()
    aplicarAparencia({ ...BASE, iconeApp: '' })
    expect(toque()).toBe(el)
    expect(toque()?.getAttribute('href')).toBe('/icones/icone-180.png')
  })
})

describe('contraste com a cor do administrador', () => {
  const estilo = (v: string) => document.documentElement.style.getPropertyValue(v)
  afterEach(() => aplicarAparencia({ ...BASE, cor: '' }))

  it('UT-418 azul padrão: texto branco sobre o degradê e links com 4,5:1', () => {
    aplicarAparencia({ ...BASE, cor: '#3b82f6' })
    expect(estilo('--cor-texto')).toBe('#ffffff')
    expect(contraste('#ffffff', estilo('--cor-4'))).toBeGreaterThanOrEqual(4.5)
    expect(contraste(estilo('--cor-link-claro'), '#e8edf5')).toBeGreaterThanOrEqual(4.5)
    expect(contraste(estilo('--cor-link-escuro'), '#1a2332')).toBeGreaterThanOrEqual(4.5)
  })

  it('UT-419 cor clara (amarelo): texto escuro no degradê e link escurecido até passar', () => {
    aplicarAparencia({ ...BASE, cor: '#facc15' })
    expect(estilo('--cor-texto')).toBe('#0f172a')
    expect(contraste(estilo('--cor-link-claro'), '#e8edf5')).toBeGreaterThanOrEqual(4.5)
  })

  it('UT-420 sem cor configurada as variáveis calculadas somem', () => {
    aplicarAparencia({ ...BASE, cor: '#facc15' })
    aplicarAparencia({ ...BASE, cor: '' })
    for (const v of ['--cor-texto', '--cor-link-claro', '--cor-link-escuro']) expect(estilo(v)).toBe('')
  })
})
