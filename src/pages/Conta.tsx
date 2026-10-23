import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { senhaVazada, validarSenha } from '../lib/senha'

export default function Conta() {
  const { session, carregando, sair } = useAuth()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [msg, setMsg] = useState('')
  const [novaSenha, setNovaSenha] = useState('')

  useEffect(() => {
    if (!session) return
    supabase.from('perfis').select('nome, telefone').eq('id', session.user.id).single().then(({ data }) => {
      if (data) {
        setNome(data.nome ?? '')
        setTelefone(data.telefone ?? '')
      }
    })
  }, [session])

  if (carregando) return <div className="container secao">Carregando...</div>
  if (!session) return <Navigate to="/entrar" replace />

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('perfis').update({ nome: nome.trim(), telefone: telefone.trim() || null }).eq('id', session!.user.id)
    setMsg(error ? 'Não foi possível salvar.' : 'Dados salvos.')
  }

  async function trocarSenha(e: FormEvent) {
    e.preventDefault()
    const problema = validarSenha(novaSenha)
    if (problema) return setMsg(problema)
    if (await senhaVazada(novaSenha)) return setMsg('Esta senha já apareceu em vazamentos. Escolha outra.')
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setMsg(error ? 'Não foi possível trocar a senha.' : 'Senha alterada.')
    setNovaSenha('')
  }

  async function baixarDados() {
    const { data } = await supabase.from('perfis').select('*').eq('id', session!.user.id).single()
    const blob = new Blob([JSON.stringify({ email: session!.user.email, perfil: data }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'meus-dados-master-print.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function excluirDados() {
    if (!confirm('Apagar seus dados de cadastro? Você será desconectado.')) return
    await supabase.from('perfis').delete().eq('id', session!.user.id)
    await sair()
    alert('Seus dados de perfil foram apagados. Para remover também o login, fale conosco pelo WhatsApp.')
  }

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">Minha conta</h1>
      <p className="subtitulo">{session.user.email}</p>
      <form className="form-checkout form-auth" onSubmit={salvar}>
        <h2>Meus dados</h2>
        <div className="campo"><label htmlFor="nome">Nome</label>
          <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div className="campo"><label htmlFor="tel">WhatsApp</label>
          <input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
        <button className="btn btn-primario">Salvar</button>
      </form>
      <form className="form-checkout form-auth" onSubmit={trocarSenha}>
        <h2>Trocar senha</h2>
        <div className="campo"><label htmlFor="ns">Nova senha</label>
          <input id="ns" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} /></div>
        <button className="btn btn-secundario">Trocar senha</button>
      </form>
      {msg && <p className="dica" role="status">{msg}</p>}
      <div className="acoes-produto">
        <button className="btn btn-secundario" onClick={baixarDados}>Baixar meus dados</button>
        <button className="btn btn-secundario" onClick={excluirDados}>Apagar meus dados</button>
        <button className="btn btn-secundario" onClick={sair}>Sair</button>
      </div>
    </div>
  )
}
