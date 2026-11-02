import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { X } from 'lucide-react'

type Props = {
  aberto: boolean
  onFechar: () => void
  /** Nome do painel para leitores de tela. */
  rotulo: string
  /** Quem recebe o foco quando o painel fecha (o botão que abriu). */
  devolverFocoPara?: RefObject<HTMLElement | null>
  children: ReactNode
}

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const DESLIZE_MINIMO = 40
const DURACAO_SAIDA = 220 // igual à transição do .drawer-painel em styles.css

/** Painel lateral sobre um fundo escurecido: trava a rolagem da página, prende o foco e fecha com Esc, fundo, botão ou deslize para a esquerda. */
export default function Drawer({ aberto, onFechar, rotulo, devolverFocoPara, children }: Props) {
  const painel = useRef<HTMLDivElement>(null)
  const inicio = useRef<{ x: number; y: number } | null>(null)
  const fechar = useRef(onFechar)
  fechar.current = onFechar
  const foco = useRef(devolverFocoPara)
  foco.current = devolverFocoPara
  const [entrou, setEntrou] = useState(false)
  // Continua montado durante a animação de saída
  const [montado, setMontado] = useState(aberto)

  useEffect(() => {
    if (aberto) return setMontado(true)
    const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setMontado(false), reduzido ? 0 : DURACAO_SAIDA)
    return () => clearTimeout(t)
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const html = document.documentElement
    html.classList.add('sem-rolagem')
    const quadro = requestAnimationFrame(() => setEntrou(true))
    painel.current?.querySelector<HTMLElement>('.drawer-fechar')?.focus()
    const teclado = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') fechar.current()
    }
    document.addEventListener('keydown', teclado)
    return () => {
      cancelAnimationFrame(quadro)
      setEntrou(false)
      html.classList.remove('sem-rolagem')
      document.removeEventListener('keydown', teclado)
      foco.current?.current?.focus()
    }
  }, [aberto])

  if (!aberto && !montado) return null

  function prenderFoco(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const itens = [...(painel.current?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? [])]
    if (itens.length === 0) return
    const primeiro = itens[0]
    const ultimo = itens[itens.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primeiro.focus()
    }
  }

  function soltou(e: PointerEvent) {
    const ini = inicio.current
    inicio.current = null
    if (!ini) return
    const dx = e.clientX - ini.x
    const dy = e.clientY - ini.y
    if (dx <= -DESLIZE_MINIMO && Math.abs(dx) > Math.abs(dy)) onFechar()
  }

  return (
    <div className={`drawer${entrou ? ' drawer-aberto' : ''}${aberto ? '' : ' drawer-saindo'}`}>
      <div className="drawer-fundo" onClick={onFechar} aria-hidden="true" />
      <div
        ref={painel}
        className="drawer-painel"
        role="dialog"
        aria-modal="true"
        aria-label={rotulo}
        onKeyDown={prenderFoco}
        onPointerDown={(e) => (inicio.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={soltou}
        onPointerCancel={() => (inicio.current = null)}
      >
        <button type="button" className="icone-botao drawer-fechar" onClick={onFechar} aria-label="Fechar menu">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  )
}
