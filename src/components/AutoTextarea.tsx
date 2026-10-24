import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

// Caixa de texto que cresce e encolhe sozinha conforme o conteúdo (sem rolagem interna).
export default function AutoTextarea({ value, rows = 2, ...resto }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return <textarea ref={ref} value={value} rows={rows} style={{ overflow: 'hidden', resize: 'none' }} {...resto} />
}
