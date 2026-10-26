import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ContaDados from '../conta/ContaDados'
import ContaPedidos from '../conta/ContaPedidos'
import ContaEnderecos from '../conta/ContaEnderecos'
import ContaSeguranca from '../conta/ContaSeguranca'
import ContaPrivacidade from '../conta/ContaPrivacidade'

const ABAS = [
  { id: 'dados', nome: 'Meus dados' },
  { id: 'pedidos', nome: 'Pedidos' },
  { id: 'enderecos', nome: 'Endereços' },
  { id: 'seguranca', nome: 'Segurança' },
  { id: 'privacidade', nome: 'Privacidade' },
] as const

export default function Conta() {
  const { session, carregando, sair } = useAuth()
  const [params, setParams] = useSearchParams()
  const atual = ABAS.find((a) => a.id === params.get('aba'))?.id ?? 'dados'

  if (carregando) return <div className="container secao">Carregando...</div>
  if (!session) return <Navigate to="/entrar?voltar=/conta" replace />

  const nome = (session.user.user_metadata as { nome?: string })?.nome

  return (
    <div className="container secao conta">
      <div className="secao-topo">
        <div>
          <h1 className="titulo-pagina">Minha conta</h1>
          <p className="subtitulo">{nome ? `Olá, ${nome.split(' ')[0]}! ` : ''}{session.user.email}</p>
        </div>
        <button className="btn btn-secundario" onClick={sair}>Sair</button>
      </div>
      <div className="filtros" role="tablist">
        {ABAS.map((a) => (
          <button key={a.id} role="tab" aria-selected={atual === a.id} className={atual === a.id ? 'ativo' : ''} onClick={() => setParams({ aba: a.id })}>
            {a.nome}
          </button>
        ))}
      </div>
      {atual === 'dados' && <ContaDados />}
      {atual === 'pedidos' && <ContaPedidos />}
      {atual === 'enderecos' && <ContaEnderecos />}
      {atual === 'seguranca' && <ContaSeguranca />}
      {atual === 'privacidade' && <ContaPrivacidade />}
    </div>
  )
}
