import { useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, Send, Share2 } from 'lucide-react'

type Props = { titulo: string; texto?: string; className?: string }

/** Compartilhar a página atual: folha de compartilhamento do aparelho quando existe; senão WhatsApp, Facebook, Telegram e copiar link. */
export default function Compartilhar({ titulo, texto, className = 'btn btn-secundario' }: Props) {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const url = () => window.location.href.split('#')[0]
  const mensagem = texto ?? `Olha este produto: ${titulo}`

  async function aoClicar() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: titulo, text: mensagem, url: url() })
      } catch {
        /* pessoa cancelou */
      }
      return
    }
    setAberto((a) => !a)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o link:', url())
    }
  }

  const u = encodeURIComponent(url())
  const t = encodeURIComponent(mensagem)
  return (
    <div className="compartilhar" ref={raiz}>
      <button type="button" className={className} onClick={aoClicar} aria-haspopup="menu" aria-expanded={aberto}>
        <Share2 size={16} aria-hidden="true" /> Compartilhar
      </button>
      {aberto && (
        <div className="compartilhar-menu" role="menu">
          <a role="menuitem" href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noreferrer">
            <MessageCircle size={18} aria-hidden="true" /> WhatsApp
          </a>
          <a role="menuitem" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noreferrer">
            <ExternalLink size={18} aria-hidden="true" /> Facebook
          </a>
          <a role="menuitem" href={`https://t.me/share/url?url=${u}&text=${t}`} target="_blank" rel="noreferrer">
            <Send size={18} aria-hidden="true" /> Telegram
          </a>
          <button type="button" role="menuitem" onClick={copiar}>
            {copiado ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      )}
    </div>
  )
}
