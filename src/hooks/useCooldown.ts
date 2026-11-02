import { useCallback, useEffect, useState } from 'react'

/** Contagem regressiva (reenvio de e-mail). `iniciar` é ignorado enquanto a contagem corre. */
export function useCooldown(segundos: number) {
  const [restante, setRestante] = useState(0)
  const ativo = restante > 0

  useEffect(() => {
    if (!ativo) return
    const id = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [ativo])

  const iniciar = useCallback(() => setRestante((r) => (r > 0 ? r : segundos)), [segundos])
  return { restante, iniciar }
}
