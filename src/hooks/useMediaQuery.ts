import { useCallback, useSyncExternalStore } from 'react'

const consultar = (query: string) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query) : null)

/** Acompanha uma media query; já devolve o valor certo no primeiro render. */
export function useMediaQuery(query: string): boolean {
  const assinar = useCallback(
    (avisar: () => void) => {
      const lista = consultar(query)
      if (!lista) return () => {}
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    [query],
  )
  return useSyncExternalStore(assinar, () => consultar(query)?.matches ?? false, () => false)
}
