import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { erroAmigavel, useAuth } from '../lib/auth'

export default function Entrar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/conta" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) return setErro(erroAmigavel(error.message))
    navigate('/conta')
  }

  async function esqueci() {
    if (!email.trim()) return setErro('Digite seu e-mail acima para receber o link.')
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/conta` })
    setErro('')
    alert('Se este e-mail tiver cadastro, enviamos um link para criar nova senha.')
  }

  return (
    <div className="container secao">
      <form className="form-checkout form-auth" onSubmit={enviar}>
        <h1 className="titulo-pagina">Entrar</h1>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <p className="dica" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
        <button type="button" className="link-botao" onClick={esqueci}>Esqueci minha senha</button>
        <p className="dica">Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></p>
      </form>
    </div>
  )
}
