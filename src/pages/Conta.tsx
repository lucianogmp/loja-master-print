import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Link, useNavegar } from '../components/Link'
import { useShell } from '../components/LojaShell'
import Avatar from '../components/Avatar'
import DicaInstalar from '../components/DicaInstalar'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const LINHAS = [
  { para: '/pedidos', rotulo: 'Meus pedidos' },
  { para: '/conta/dados', rotulo: 'Meus dados' },
  { para: '/conta/enderecos', rotulo: 'Endereços' },
  { para: '/conta/seguranca', rotulo: 'Segurança' },
  { para: '/conta/privacidade', rotulo: 'Privacidade' },
  { para: '/atendimento', rotulo: 'Atendimento' },
]

/** /conta: no celular é o menu da conta; no computador abre direto em Meus dados (o menu lateral fica no ContaLayout). */
export default function Conta() {
  const { ehMobile } = useShell()
  const { state } = useLocation()
  // o state segue junto: avisos passageiros (ex.: "Senha alterada") chegam à tela de dados
  if (!ehMobile) return <Navigate to="/conta/dados" replace state={state} />
  return <ContaHub />
}

function ContaHub() {
  const { session, sair } = useAuth()
  const navegar = useNavegar()
  const [perfil, setPerfil] = useState<{ carregando: boolean; nome?: string; falhou?: boolean }>({ carregando: true })
  const uid = session?.user.id

  useEffect(() => {
    if (!uid) return
    let vivo = true
    setPerfil({ carregando: true })
    Promise.resolve(supabase.from('perfis').select('nome').eq('id', uid).maybeSingle()).then(
      ({ data, error }) => vivo && setPerfil(error ? { carregando: false, falhou: true } : { carregando: false, nome: (data as { nome?: string } | null)?.nome }),
      () => vivo && setPerfil({ carregando: false, falhou: true }),
    )
    return () => {
      vivo = false
    }
  }, [uid])

  if (!session) return null
  const email = session.user.email ?? ''
  const nomeLogin = (session.user.user_metadata as { nome?: string } | undefined)?.nome
  const nome = (perfil.nome || nomeLogin || '').trim()

  async function sairDaConta() {
    await sair()
    navegar('/', { replace: true })
  }

  return (
    <div className="hub">
      <div className="hub-cabecalho">
        <Avatar nome={nomeLogin} email={email} tamanho="g" />
        <div className="hub-identidade">
          {perfil.carregando ? (
            <span className="esqueleto esqueleto-linha" aria-hidden="true" />
          ) : (
            <strong className="hub-nome">{nome || email}</strong>
          )}
          {(nome || perfil.carregando) && <span className="dica hub-email">{email}</span>}
          {perfil.falhou && <span className="dica" role="status">Não foi possível carregar seus dados.</span>}
        </div>
      </div>
      <ul className="hub-lista vidro">
        {LINHAS.map((l) => (
          <li key={l.para}>
            <Link to={l.para} className="hub-linha">
              <span>{l.rotulo}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </li>
        ))}
        <DicaInstalar variante="linha" />
        <li>
          <button type="button" className="hub-linha hub-sair" onClick={sairDaConta}>Sair</button>
        </li>
      </ul>
    </div>
  )
}
