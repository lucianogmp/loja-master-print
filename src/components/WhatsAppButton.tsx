import { MessageCircle } from 'lucide-react'
import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'

export default function WhatsAppButton() {
  const { empresa } = useSite()
  return (
    <a
      className="whatsapp-flutuante"
      href={linkWhatsApp(`${empresa.mensagemWhatsApp} Gostaria de atendimento.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar pelo WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  )
}
