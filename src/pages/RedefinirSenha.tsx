import { useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Link, useNavegar } from '../components/Link'
import CampoSenha from '../components/CampoSenha'
import { supabase } from '../lib/supabase'
import { erroAmigavel, MSG_SEM_CONEXAO, useAuth } from '../lib/auth'
import { senhaVazada, validarSenha } from '../lib/senha'
import { useVoltar } from '../lib/voltar'

export default function RedefinirSenha() {
  const { session, carregando, recuperacao, concluirRecuperacao } = useAuth()
  const { hash } = useLocation()
  const { destino } = useVoltar()
  const navegar = useNavegar()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const trava = useRef(false)

  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const linkComErro = !!params.get('error_code') || !!params.get('error')
  const emRecuperacao = !linkComErro && (recuperacao || params.get('type') === 'recovery')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (trava.current) return
    setErro('')
    if (validarSenha(senha)) return setErro('A senha precisa ter 8 caracteres, com letras e números.')
    if (senha !== confirma) return setErro('As senhas não coincidem.')
    trava.current = true
    setEnviando(true)
    try {
      if (await senhaVazada(senha)) return setErro('Essa senha apareceu em vazamentos. Escolha outra.')
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) return setErro(erroAmigavel(error.message))
      concluirRecuperacao()
      navegar(destino, { replace: true, state: { aviso: 'Senha alterada' } })
    } catch {
      setErro(MSG_SEM_CONEXAO)
    } finally {
      trava.current = false
      setEnviando(false)
    }
  }

  if (emRecuperacao) {
    return (
      <div className="container secao">
        <form className="form-checkout form-auth" onSubmit={enviar} noValidate>
          <h1 className="titulo-pagina">Nova senha</h1>
          <div className="campo">
            <label htmlFor="nova">Nova senha</label>
            <CampoSenha id="nova" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <span className="dica">Mínimo de 8 caracteres, com letras e números</span>
          </div>
          <div className="campo">
            <label htmlFor="confirma">Confirmar nova senha</label>
            <CampoSenha id="confirma" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
          </div>
          {erro && <p className="dica erro-campo" role="alert">{erro}</p>}
          <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar nova senha'}</button>
        </form>
      </div>
    )
  }

  if (!linkComErro && carregando) return <div className="container secao sessao-espera" aria-busy="true">Carregando...</div>

  if (!linkComErro && session) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Redefinir senha</h1>
        <p className="subtitulo">Para trocar a senha, use Conta &gt; Segurança.</p>
        <Link to="/conta/seguranca" className="btn btn-primario">Ir para Segurança</Link>
      </div>
    )
  }

  return (
    <div className="container secao centro">
      <h1 className="titulo-pagina">Link inválido ou expirado</h1>
      <p className="subtitulo">Peça um novo link para criar sua senha.</p>
      <Link to="/esqueci-senha" className="btn btn-primario">Pedir novo link</Link>
    </div>
  )
}
