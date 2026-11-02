import { useRef, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Link, useNavegar } from '../components/Link'
import CampoSenha from '../components/CampoSenha'
import { supabase } from '../lib/supabase'
import { erroAmigavel, MSG_SEM_CONEXAO, reenviarConfirmacao, useAuth } from '../lib/auth'
import { emailValido } from '../lib/emailValido'
import { comVoltar, useVoltar } from '../lib/voltar'
import { useCooldown } from '../hooks/useCooldown'

export default function Entrar() {
  const { session } = useAuth()
  const navegar = useNavegar()
  const { destino, sufixo } = useVoltar()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroEmail, setErroEmail] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [erro, setErro] = useState('')
  const [naoConfirmado, setNaoConfirmado] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [erroReenvio, setErroReenvio] = useState('')
  const trava = useRef(false)
  const senhaRef = useRef<HTMLInputElement>(null)
  const cooldown = useCooldown(60)

  if (session) return <Navigate to={destino} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (trava.current) return
    setErro('')
    setNaoConfirmado(false)
    setReenviado(false)
    setErroReenvio('')
    const ruimEmail = emailValido(email) ? '' : 'Informe um e-mail válido.'
    const ruimSenha = senha ? '' : 'Informe sua senha.'
    setErroEmail(ruimEmail)
    setErroSenha(ruimSenha)
    if (ruimEmail || ruimSenha) return
    trava.current = true
    setEnviando(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) {
        setErro(erroAmigavel(error.message))
        if (error.message.toLowerCase().includes('email not confirmed')) setNaoConfirmado(true)
        else {
          setSenha('')
          senhaRef.current?.focus()
        }
        return
      }
      navegar(destino, { replace: true })
    } catch {
      setErro(MSG_SEM_CONEXAO)
    } finally {
      trava.current = false
      setEnviando(false)
    }
  }

  async function reenviar() {
    if (reenviando) return
    setErroReenvio('')
    setReenviado(false)
    setReenviando(true)
    try {
      const { error } = await reenviarConfirmacao(email.trim(), destino)
      if (error) return setErroReenvio('Não foi possível reenviar. Tente novamente.')
      setReenviado(true)
      cooldown.iniciar()
    } catch {
      setErroReenvio(MSG_SEM_CONEXAO)
    } finally {
      setReenviando(false)
    }
  }

  const base = comVoltar('/esqueci-senha', destino)
  const linkEsqueci = email.trim() ? `${base}${base.includes('?') ? '&' : '?'}email=${encodeURIComponent(email.trim())}` : base

  return (
    <div className="container secao">
      <form className="form-checkout form-auth" onSubmit={enviar} noValidate>
        <h1 className="titulo-pagina">Entrar</h1>
        {params.get('aviso') === 'link-expirado' && (
          <p className="aviso" role="status">Link inválido ou expirado. Entre ou peça um novo link.</p>
        )}
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" value={email} aria-invalid={!!erroEmail} onChange={(e) => setEmail(e.target.value)} />
          {erroEmail && <span className="dica erro-campo" role="alert">{erroEmail}</span>}
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <CampoSenha id="senha" ref={senhaRef} autoComplete="current-password" value={senha} aria-invalid={!!erroSenha} onChange={(e) => setSenha(e.target.value)} />
          {erroSenha && <span className="dica erro-campo" role="alert">{erroSenha}</span>}
        </div>
        {erro && <p className="dica erro-campo" role="alert">{erro}</p>}
        {naoConfirmado && (
          <div>
            <button type="button" className="btn btn-secundario btn-bloco" disabled={reenviando || cooldown.restante > 0} onClick={reenviar}>
              {cooldown.restante > 0 ? `Reenviar e-mail (${cooldown.restante}s)` : 'Reenviar e-mail'}
            </button>
            {reenviado && <p className="dica" role="status">E-mail reenviado.</p>}
            {erroReenvio && <p className="dica erro-campo" role="alert">{erroReenvio}</p>}
          </div>
        )}
        <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
        <Link to={linkEsqueci} className="link-botao">Esqueci minha senha</Link>
        <p className="dica">Ainda não tem conta? <Link to={`/cadastro${sufixo}`}>Criar conta</Link></p>
      </form>
    </div>
  )
}
