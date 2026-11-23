import { useEffect, useRef } from 'react'

/** Permite colar imagem (Ctrl+V / Cmd+V) enquanto a tela está aberta. Só reage quando o que foi copiado é imagem. */
export function useColarFotos(aoColar: (arquivos: File[]) => void, ativo = true) {
  const ref = useRef(aoColar)
  ref.current = aoColar
  useEffect(() => {
    if (!ativo) return
    const tratar = (e: ClipboardEvent) => {
      const arquivos = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (arquivos.length === 0) return
      e.preventDefault()
      ref.current(arquivos)
    }
    document.addEventListener('paste', tratar)
    return () => document.removeEventListener('paste', tratar)
  }, [ativo])
}
