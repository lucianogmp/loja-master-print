import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import CampoSenha from '../components/CampoSenha'
import { useNavegar } from '../components/Link'
import { limparCachePedidos } from '../lib/pedidos'
import { senhaVazada, validarSenha } from '../lib/senha'

export default function ContaSeguranca() {
  const [nova, setNova] = useState('')
  const [repetir, setRepetir] = useState('')
  const [msg, setMsg] = useState('')
  const navegar = useNavegar()

  async function trocar(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    const problema = validarSenha(nova)
    if (problema) return setMsg(problema)
    if (nova !== repetir) return setMsg('As senhas não coincidem.')
    if (await senhaVazada(nova)) return setMsg('Esta senha já apareceu em vazamentos de dados. Escolha outra.')
    const { error } = await supabase.auth.updateUser({ password: nova })
    setMsg(error ? 'Não foi possível trocar a senha.' : 'Senha alterada.')
    if (!error) {
      setNova('')
      setRepetir('')
    }
  }

  async function sairTodos() {
    if (!confirm('Sair da sua conta em todos os aparelhos, inclusive neste?')) return
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      limparCachePedidos()
      navegar('/', { replace: true })
    } catch {
      setMsg('Não foi possível sair dos outros aparelhos agora. Tente novamente.')
    }
  }

  return (
    <div className="conta-bloco">
      <h1 className="titulo-pagina titulo-sub">Segurança</h1>
      <form className="conta-bloco" onSubmit={trocar}>
        <h2>Trocar senha</h2>
        <div className="linha-campos">
          <div className="campo">
            <label htmlFor="s-nova">Nova senha</label>
            <CampoSenha id="s-nova" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="s-rep">Repetir a nova senha</label>
            <CampoSenha id="s-rep" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} />
          </div>
        </div>
        <span className="dica">Mínimo 8 caracteres, com letras e números.</span>
        {msg && <p className="dica" role="status">{msg}</p>}
        <div>
          <button className="btn btn-primario">Trocar senha</button>
        </div>
      </form>
      <div className="conta-bloco">
        <h2>Aparelhos conectados</h2>
        <p className="dica">Entrou em um computador que não é seu? Saia de todos os aparelhos de uma vez.</p>
        <div>
          <button className="btn btn-secundario" onClick={sairTodos}>Sair de todos os aparelhos</button>
        </div>
      </div>
    </div>
  )
}
