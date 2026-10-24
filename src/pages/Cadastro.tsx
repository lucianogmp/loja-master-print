import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { erroAmigavel } from '../lib/auth'
import { senhaVazada, validarSenha } from '../lib/senha'
import { useVoltar } from '../lib/voltar'

export default function Cadastro() {
  const { destino, sufixo } = useVoltar()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const problema = validarSenha(senha)
    if (problema) return setErro(problema)
    if (!aceite) return setErro('É preciso aceitar a Política de Privacidade.')
    setEnviando(true)
    if (await senhaVazada(senha)) {
      setEnviando(false)
      return setErro('Esta senha já apareceu em vazamentos de dados. Escolha outra.')
    }
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: { nome: nome.trim(), telefone: telefone.trim() },
        emailRedirectTo: `${window.location.origin}${destino}`,
      },
    })
    setEnviando(false)
    if (error) return setErro(erroAmigavel(error.message))
    setPronto(true) // mesma resposta exista o e-mail ou não
  }

  if (pronto) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Confira seu e-mail</h1>
        <p className="subtitulo">Enviamos um link para confirmar sua conta. Depois é só entrar.</p>
        <Link to={`/entrar${sufixo}`} className="btn btn-primario">Ir para o login</Link>
      </div>
    )
  }

  return (
    <div className="container secao">
      <form className="form-checkout form-auth" onSubmit={enviar}>
        <h1 className="titulo-pagina">Criar conta</h1>
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input id="nome" required minLength={2} autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="tel">WhatsApp</label>
          <input id="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" required autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <span className="dica">Mínimo 8 caracteres, com letras e números. Senhas muito comuns não são aceitas.</span>
        </div>
        <label className="radio">
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
          Aceito a Política de Privacidade e o uso dos meus dados para atender meus pedidos.
        </label>
        {erro && <p className="dica" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Criando...' : 'Criar conta'}</button>
        <p className="dica">Já tem conta? <Link to={`/entrar${sufixo}`}>Entrar</Link></p>
      </form>
    </div>
  )
}
