import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'
import { definirMidia } from '../test/matchMedia'

const CONSULTA = '(max-width: 767.98px)'

describe('useMediaQuery', () => {
  it('UT-077 valor certo já no primeiro render', () => {
    definirMidia({ mobile: true })
    const valores: boolean[] = []
    renderHook(() => valores.push(useMediaQuery(CONSULTA)))
    expect(valores[0]).toBe(true)
  })

  it('UT-078 acompanha o evento change', () => {
    definirMidia({ mobile: true })
    const { result } = renderHook(() => useMediaQuery(CONSULTA))
    act(() => definirMidia({ mobile: false }))
    expect(result.current).toBe(false)
  })

  it('UT-079 ao desmontar remove o ouvinte uma vez', () => {
    const lista = window.matchMedia(CONSULTA)
    const remover = vi.spyOn(lista, 'removeEventListener')
    const { unmount } = renderHook(() => useMediaQuery(CONSULTA))
    unmount()
    expect(remover.mock.calls.filter(([tipo]) => tipo === 'change')).toHaveLength(1)
  })
})
