import { useRef, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Link } from '../components/Link'
import { supabase } from '../lib/supabase'
import { erroAmigavel, MSG_SEM_CONEXAO, useAuth } from '../lib/auth'
import { emailValido } from '../lib/emailValido'
import { useVoltar } from '../lib/voltar'
import { useCooldown } from '../hooks/useCooldown'

export default function EsqueciSenha() {
  const { session } = useAuth()
  const { sufixo } = useVoltar()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [erroEmail, setErroEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const trava = useRef(false)
  const cooldown = useCooldown(60)

  if (session) return <Navigate to="/conta/seguranca" replace />

  async function enviar(e?: FormEvent) {
    e?.preventDefault()
    if (trava.current) return
    setErro('')
    const ruim = emailValido(email) ? '' : 'Informe um e-mail válido.'
    setErroEmail(ruim)
    if (ruim) return
    trava.current = true
    setEnviando(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha${sufixo}`,
      })
      if (error) {
        setEnviado(false)
        return setErro(erroAmigavel(error.message))
      }
      // mesma resposta exista o e-mail ou não
      setEnviado(true)
      cooldown.iniciar()
    } catch {
      setErro(MSG_SEM_CONEXAO)
    } finally {
      trava.current = false
      setEnviando(false)
    }
  }

  return (
    <div className="container secao">
      <form className="form-checkout form-auth" onSubmit={enviar} noValidate>
        <h1 className="titulo-pagina">Esqueci minha senha</h1>
        <p className="subtitulo">Digite seu e-mail e enviaremos um link para criar uma nova senha.</p>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" value={email} aria-invalid={!!erroEmail} onChange={(e) => setEmail(e.target.value)} />
          {erroEmail && <span className="dica erro-campo" role="alert">{erroEmail}</span>}
        </div>
        {erro && <p className="dica erro-campo" role="alert">{erro}</p>}
        {enviado && <p className="aviso" role="status">Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.</p>}
        {enviado ? (
          <button type="submit" className="btn btn-secundario btn-bloco" disabled={enviando || cooldown.restante > 0}>
            {cooldown.restante > 0 ? `Reenviar (${cooldown.restante}s)` : 'Reenviar'}
          </button>
        ) : (
          <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar link'}</button>
        )}
        <p className="dica"><Link to={`/entrar${sufixo}`}>Voltar para entrar</Link></p>
      </form>
    </div>
  )
}
