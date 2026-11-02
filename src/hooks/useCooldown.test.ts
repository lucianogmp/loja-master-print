import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCooldown } from './useCooldown'

describe('useCooldown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('UT-080 iniciar → 60, depois 59', () => {
    const { result } = renderHook(() => useCooldown(60))
    act(() => result.current.iniciar())
    expect(result.current.restante).toBe(60)
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.restante).toBe(59)
  })

  it('UT-081 chega a 0 e para o relógio', () => {
    const { result } = renderHook(() => useCooldown(60))
    act(() => result.current.iniciar())
    act(() => void vi.advanceTimersByTime(60_000))
    expect(result.current.restante).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('UT-082 iniciar em andamento não reinicia', () => {
    const { result } = renderHook(() => useCooldown(60))
    act(() => result.current.iniciar())
    act(() => void vi.advanceTimersByTime(30_000))
    act(() => result.current.iniciar())
    expect(result.current.restante).toBe(30)
  })
})
