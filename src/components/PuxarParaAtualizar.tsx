import { useEffect, useRef, useState, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { useMediaQuery } from '../hooks/useMediaQuery'

const LIMITE = 64 // px de arrasto para disparar

type Props = { onAtualizar: () => Promise<unknown> | void; ativo?: boolean; children: ReactNode }

/** Puxar para atualizar (celular): arrastar para baixo com a página no topo chama `onAtualizar`, uma por vez. */
export default function PuxarParaAtualizar({ onAtualizar, ativo = true, children }: Props) {
  const reduzido = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [puxando, setPuxando] = useState(0)
  const [atualizando, setAtualizando] = useState(false)
  const inicio = useRef<number | null>(null)
  const distancia = useRef(0)
  const emAndamento = useRef(false)

  // O navegador não deve recarregar a página sozinho enquanto esta tela estiver aberta
  useEffect(() => {
    if (!ativo) return
    document.documentElement.classList.add('sem-ptr-nativo')
    return () => document.documentElement.classList.remove('sem-ptr-nativo')
  }, [ativo])

  if (!ativo) return <>{children}</>

  function aoTocar(e: React.TouchEvent) {
    inicio.current = window.scrollY === 0 && !emAndamento.current ? e.touches[0].clientY : null
    distancia.current = 0
  }
  function aoMover(e: React.TouchEvent) {
    if (inicio.current === null) return
    if (window.scrollY > 0) {
      inicio.current = null
      return setPuxando(0)
    }
    distancia.current = Math.max(0, e.touches[0].clientY - inicio.current)
    setPuxando(Math.min(distancia.current, LIMITE * 1.5))
  }
  async function aoSoltar() {
    const puxou = inicio.current !== null && distancia.current >= LIMITE
    inicio.current = null
    setPuxando(0)
    if (!puxou || emAndamento.current) return
    emAndamento.current = true
    setAtualizando(true)
    try {
      await onAtualizar()
    } finally {
      emAndamento.current = false
      setAtualizando(false)
    }
  }

  const visivel = atualizando || puxando > 0
  return (
    <div onTouchStart={aoTocar} onTouchMove={aoMover} onTouchEnd={aoSoltar} onTouchCancel={aoSoltar}>
      {visivel && (
        <div
          className={`puxar-indicador${reduzido ? ' sem-animacao' : ''}${atualizando ? ' girando' : ''}`}
          role="status"
          aria-label={atualizando ? 'Atualizando' : 'Solte para atualizar'}
          style={atualizando ? undefined : { height: puxando }}
        >
          <RefreshCw size={20} aria-hidden="true" />
        </div>
      )}
      {children}
    </div>
  )
}
