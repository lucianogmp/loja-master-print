import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { instalarMatchMedia, resetarMidia } from './matchMedia'
import { resetarFakes } from './fakes'
import { limparCachePedidos } from '../lib/pedidos'
import { reiniciarInstalacao } from '../hooks/useInstalacao'

// Fronteiras de E/S: os dois clientes Supabase viram fakes programáveis (ver ./fakes)
vi.mock('../lib/supabase', async () => ({ supabase: (await import('./fakes')).supabaseFake }))
vi.mock('../lib/erp', async () => ({ erp: (await import('./fakes')).erpFake, ERP_URL: 'https://erp.teste' }))

instalarMatchMedia()
// jsdom não implementa rolagem
window.scrollTo = vi.fn() as typeof window.scrollTo
Element.prototype.scrollIntoView = vi.fn()

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  limparCachePedidos() // estado de módulo: uma busca de pedidos não vaza para o teste seguinte
  sessionStorage.clear()
  reiniciarInstalacao()
  vi.useRealTimers()
  resetarMidia()
  resetarFakes()
  delete document.documentElement.dataset.transicao
})
