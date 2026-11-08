import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Menu } from 'lucide-react'
import { erp } from '../lib/erp'
import { CONSULTA_MOBILE } from '../lib/telas'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useMenuLateral } from '../hooks/useMenuLateral'
import AdminMenu, { type Aba } from './AdminMenu'
import AdminProdutos from './AdminProdutos'
import AdminCategorias from './AdminCategorias'
import AdminInicio from './AdminInicio'
import AdminBanners from './AdminBanners'
import AdminOfertas from './AdminOfertas'
import AdminEmpresa from './AdminEmpresa'
import AdminAparencia from './AdminAparencia'
import AdminPaginas from './AdminPaginas'
import AdminDerivados from './AdminDerivados'

const PAPEIS = ['dono', 'admin']

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<Aba>('produtos')
  const mobile = useMediaQuery(CONSULTA_MOBILE)
  const { abrir } = useMenuLateral('adminMenu')
  const botaoMenu = useRef<HTMLButtonElement>(null)

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
    <div className="container secao admin-casca">
      {mobile && (
        <header className="admin-topo">
          <button ref={botaoMenu} type="button" className="icone-botao" aria-label="Abrir menu" onClick={abrir}>
            <Menu size={22} />
          </button>
          <strong>Administração</strong>
        </header>
      )}
      <div className="admin-grade">
        <AdminMenu aba={aba} onEscolher={setAba} mobile={mobile} botaoMenu={botaoMenu} />
        <div className="admin-conteudo">
          <h1 className="titulo-pagina">Administração da loja</h1>
          {aba === 'produtos' && <AdminProdutos />}
          {aba === 'derivados' && <AdminDerivados />}
          {aba === 'categorias' && <AdminCategorias />}
          {aba === 'inicio' && <AdminInicio />}
          {aba === 'banners' && <AdminBanners />}
          {aba === 'ofertas' && <AdminOfertas />}
          {aba === 'empresa' && <AdminEmpresa />}
          {aba === 'aparencia' && <AdminAparencia />}
          {aba === 'paginas' && <AdminPaginas />}
        </div>
      </div>
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
