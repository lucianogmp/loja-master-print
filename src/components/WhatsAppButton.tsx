import { MessageCircle } from 'lucide-react'
import { linkWhatsApp } from '../config'

export default function WhatsAppButton() {
  return (
    <a
      className="whatsapp-flutuante"
      href={linkWhatsApp('Olá! Vim pelo site da Master Print e gostaria de atendimento.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar pelo WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  )
}
