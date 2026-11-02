import { MessageCircle } from 'lucide-react'
import { useContext } from 'react'
import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'
import { ShellContext } from '../lib/telas'
import { useMenuLateral } from '../hooks/useMenuLateral'

export default function WhatsAppButton() {
  const { empresa } = useSite()
  const shell = useContext(ShellContext)
  const { aberto } = useMenuLateral()
  // Some sem número configurado, fora da casca da loja, no checkout (sem barra), com o menu lateral aberto
  // e nas telas que já têm atalho de WhatsApp próprio ou campos de formulário (semWhatsApp)
  if (!empresa.whatsapp || !shell || shell.handle?.semBarra || shell.handle?.semWhatsApp || aberto) return null
  return (
    <a
      className="whatsapp-flutuante"
      href={linkWhatsApp(`${empresa.mensagemWhatsApp} Gostaria de atendimento.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={26} aria-hidden="true" />
      <span className="whatsapp-rotulo">Falar no WhatsApp</span>
    </a>
  )
}
