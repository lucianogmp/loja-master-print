import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from '../components/Link'
import { reenviarConfirmacao, MSG_SEM_CONEXAO } from '../lib/auth'
import { useVoltar } from '../lib/voltar'
import { useCooldown } from '../hooks/useCooldown'

export default function ConfirmeEmail() {
  const email = (useLocation().state as { email?: string } | null)?.email
  const { destino, sufixo } = useVoltar()
  const cooldown = useCooldown(60)
  const [aviso, setAviso] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function reenviar() {
    if (!email || enviando) return
    setErro('')
    setEnviando(true)
    try {
      const { error } = await reenviarConfirmacao(email, destino)
      if (error) return setErro('Não foi possível reenviar. Tente novamente.')
      setAviso('E-mail reenviado.')
      cooldown.iniciar()
    } catch {
      setErro(MSG_SEM_CONEXAO)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container secao centro">
      <h1 className="titulo-pagina">Confira seu e-mail</h1>
      <p className="subtitulo">
        {email ? (
          <>Enviamos um link de confirmação para <strong>{email}</strong>. Depois é só entrar.</>
        ) : (
          <>Enviamos um link para confirmar sua conta. Depois é só entrar.</>
        )}
      </p>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {erro && <p className="dica erro-campo" role="alert">{erro}</p>}
      <div className="auth-acoes">
        {email && (
          <button type="button" className="btn btn-secundario" disabled={enviando || cooldown.restante > 0} onClick={reenviar}>
            {cooldown.restante > 0 ? `Reenviar e-mail (${cooldown.restante}s)` : 'Reenviar e-mail'}
          </button>
        )}
        <Link to={`/entrar${sufixo}`} className="btn btn-primario">Voltar para entrar</Link>
      </div>
    </div>
  )
}
