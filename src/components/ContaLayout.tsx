import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { NavLink, useNavegar } from './Link'
import { useShell } from './LojaShell'
import RequerSessao from './RequerSessao'
import { useAuth } from '../lib/auth'
import { destinoAbaLegada } from '../lib/telas'

export const ITENS_CONTA = [
  { para: '/pedidos', rotulo: 'Meus pedidos' },
  { para: '/conta/dados', rotulo: 'Meus dados' },
  { para: '/conta/enderecos', rotulo: 'Endereços' },
  { para: '/conta/seguranca', rotulo: 'Segurança' },
  { para: '/conta/privacidade', rotulo: 'Privacidade' },
]

/** Porta de entrada de Pedidos e Conta: exige login (convite na própria tela) e, no computador, mostra o menu lateral. */
export default function ContaLayout() {
  const { ehMobile } = useShell()
  const { pathname, search } = useLocation()
  // Link antigo (?aba=…): vai direto à tela nova, antes de pedir login, para o "voltar" já apontar para ela
  const legado = pathname === '/conta' ? destinoAbaLegada(search) : null
  if (legado) return <Navigate to={legado} replace />
  return <RequerSessao>{ehMobile ? <Outlet /> : <ComMenu />}</RequerSessao>
}

function ComMenu() {
  const { sair } = useAuth()
  const navegar = useNavegar()

  async function sairDaConta() {
    await sair()
    navegar('/', { replace: true })
  }

  return (
    <div className="container secao conta-grade">
      <nav className="conta-menu vidro" aria-label="Minha conta">
        <ul>
          {ITENS_CONTA.map((i) => (
            <li key={i.para}>
              <NavLink to={i.para}>{i.rotulo}</NavLink>
            </li>
          ))}
          <li>
            <button type="button" className="conta-menu-sair" onClick={sairDaConta}>Sair</button>
          </li>
        </ul>
      </nav>
      <section className="conta-conteudo">
        <Outlet />
      </section>
    </div>
  )
}
