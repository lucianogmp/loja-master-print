import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'

/** Horário e WhatsApp no topo do Início, no celular (no lugar da faixa fixa do cabeçalho). */
export default function MensagemAtendimento() {
  const { empresa, paginasCarregadas } = useSite()
  const horario = empresa.horario.trim()
  const temWhatsApp = !!empresa.whatsapp

  // Reserva a altura enquanto a configuração não chegou, para a página não pular
  if (!paginasCarregadas && !horario) return <div className="mensagem-espera mensagem-altura" aria-hidden="true" />
  if (!horario && !temWhatsApp) return null

  return (
    <p className="mensagem-atendimento">
      {horario && <span className="mensagem-horario">{horario}</span>}
      {temWhatsApp && (
        <a href={linkWhatsApp()} target="_blank" rel="noreferrer">
          {horario ? 'Falar no WhatsApp' : 'Fale com a gente no WhatsApp'}
        </a>
      )}
    </p>
  )
}
