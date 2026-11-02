import { Outlet, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavegar } from './Link'
import Marca from './Marca'
import { useSite } from '../lib/site'
import { useTemHistoricoInterno } from '../lib/telas'
import { destinoSeguro } from '../lib/voltar'

/** Telas de login e cadastro: só voltar, logotipo e o formulário — sem cabeçalho, rodapé ou barras da loja. */
export default function AuthLayout() {
  const { paginas } = useSite()
  const [params] = useSearchParams()
  const navegar = useNavegar()
  const temHistorico = useTemHistoricoInterno()
  const temPrivacidade = paginas.some((p) => p.slug === 'privacidade')

  function voltar() {
    const bruto = params.get('voltar')
    if (bruto && destinoSeguro(bruto) === bruto) navegar(bruto)
    else navegar(temHistorico ? -1 : '/')
  }

  return (
    <div className="auth">
      <header className="auth-topo">
        <button type="button" className="icone-botao" onClick={voltar} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <Marca />
      </header>
      <main className="auth-corpo">
        <Outlet />
      </main>
      {temPrivacidade && (
        <footer className="auth-rodape">
          <Link to="/pagina/privacidade">Política de Privacidade</Link>
        </footer>
      )}
    </div>
  )
}
