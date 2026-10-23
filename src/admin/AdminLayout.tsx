import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { erp } from '../lib/erp'
import AdminProdutos from './AdminProdutos'
import AdminGrupos from './AdminGrupos'

const PAPEIS = ['dono', 'admin']

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<'produtos' | 'grupos'>('produtos')

  useEffect(() => {
    erp.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data } = erp.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (carregando) return <div className="container secao">Carregando...</div>
  if (!session) return <Login />

  const papel = (session.user.app_metadata as { role?: string })?.role
  if (!papel || !PAPEIS.includes(papel)) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Sem permissão</h1>
        <p className="subtitulo">Só dono e admin do sistema acessam esta área.</p>
        <button className="btn btn-secundario" onClick={() => erp.auth.signOut()}>Sair</button>
      </div>
    )
  }

  return (
    <div className="container secao">
      <div className="secao-topo">
        <h1 className="titulo-pagina">Administração da loja</h1>
        <button className="link-botao" onClick={() => erp.auth.signOut()}>Sair</button>
      </div>
      <div className="filtros" role="tablist">
        <button className={aba === 'produtos' ? 'ativo' : ''} onClick={() => setAba('produtos')}>Produtos</button>
        <button className={aba === 'grupos' ? 'ativo' : ''} onClick={() => setAba('grupos')}>Grupos do menu</button>
      </div>
      {aba === 'produtos' ? <AdminProdutos /> : <AdminGrupos />}
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const { error } = await erp.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
  }
  return (
    <div className="container secao">
      <form className="form-checkout form-auth" onSubmit={enviar}>
        <h1 className="titulo-pagina">Administração</h1>
        <p className="subtitulo">Use o mesmo login do seu sistema (ERP).</p>
        <div className="campo"><label htmlFor="ae">E-mail</label>
          <input id="ae" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="campo"><label htmlFor="as">Senha</label>
          <input id="as" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        {erro && <p className="dica" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco">Entrar</button>
      </form>
    </div>
  )
}
