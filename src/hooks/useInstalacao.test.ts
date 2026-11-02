import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useInstalacao } from './useInstalacao'
import { definirMidia } from '../test/matchMedia'
import { definirUserAgent, dispararInstalacao, UA_INSTAGRAM, UA_IPHONE } from '../test/instalacao'

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'standalone')
})

describe('useInstalacao', () => {
  it('UT-083 display-mode standalone: instalado', () => {
    definirMidia({ standalone: true })
    expect(renderHook(() => useInstalacao()).result.current.instalado).toBe(true)
  })

  it('UT-084 navigator.standalone: instalado', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    expect(renderHook(() => useInstalacao()).result.current.instalado).toBe(true)
  })

  it('UT-085 beforeinstallprompt habilita o pedido; aceitar dispensa para sempre', async () => {
    const { result } = renderHook(() => useInstalacao())
    expect(result.current.podeSolicitar).toBe(false)
    const evento = dispararInstalacao('accepted')
    expect(result.current.podeSolicitar).toBe(true)
    let r: string | undefined
    await act(async () => void (r = await result.current.solicitar()))
    expect(r).toBe('aceitou')
    expect(evento.prompt).toHaveBeenCalled()
    expect(result.current.dispensada).toBe(true)
  })

  it('UT-086 recusar: "recusou" e o pedido continua possível', async () => {
    const { result } = renderHook(() => useInstalacao())
    dispararInstalacao('dismissed')
    let r: string | undefined
    await act(async () => void (r = await result.current.solicitar()))
    expect(r).toBe('recusou')
    expect(result.current.podeSolicitar).toBe(true)
  })

  it('UT-087 sem evento: indisponível', async () => {
    const { result } = renderHook(() => useInstalacao())
    expect(await result.current.solicitar()).toBe('indisponivel')
  })

  it('UT-088 iPhone Safari: ios', () => {
    definirUserAgent(UA_IPHONE)
    expect(renderHook(() => useInstalacao()).result.current.plataforma).toBe('ios')
  })

  it('UT-089 Instagram / FBAN: navegador embutido', () => {
    definirUserAgent(UA_INSTAGRAM)
    expect(renderHook(() => useInstalacao()).result.current.plataforma).toBe('navegador-embutido')
    definirUserAgent('Mozilla/5.0 (Linux; Android 13) [FBAN/FB4A;FBAV/400.0]')
    expect(renderHook(() => useInstalacao()).result.current.plataforma).toBe('navegador-embutido')
  })

  it('UT-090 dispensada por 29 dias', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    const { result } = renderHook(() => useInstalacao())
    act(() => result.current.dispensar())
    expect(result.current.dispensada).toBe(true)
    vi.setSystemTime(new Date('2026-01-30T12:00:00Z'))
    expect(renderHook(() => useInstalacao()).result.current.dispensada).toBe(true)
  })

  it('UT-091 depois de 31 dias volta a aparecer', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    const { result } = renderHook(() => useInstalacao())
    act(() => result.current.dispensar())
    vi.setSystemTime(new Date('2026-02-01T12:00:00Z'))
    expect(renderHook(() => useInstalacao()).result.current.dispensada).toBe(false)
  })

  it('UT-092 armazenamento que falha: não dispensada e dispensar não lança', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const { result } = renderHook(() => useInstalacao())
    expect(result.current.dispensada).toBe(false)
    expect(() => act(() => result.current.dispensar())).not.toThrow()
  })
})
