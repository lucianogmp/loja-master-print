import { useState } from 'react'
import { Link } from './Link'
import { useSite } from '../lib/site'

/** Logotipo da loja com link para o início: a imagem enviada na administração ou o ícone + nome. */
export default function Marca() {
  const { empresa, aparencia } = useSite()
  const [primeira, ...restoPalavras] = empresa.nome.toUpperCase().split(' ')
  const resto = restoPalavras.join(' ')
  // Imagem do logo que não carrega → cai para o ícone + nome
  const [logoFalhou, setLogoFalhou] = useState(false)

  if ((aparencia.logo || aparencia.logoEscuro) && !logoFalhou)
    return (
      <Link to="/" className="marca marca-so-logo" aria-label={`${empresa.nome} — página inicial`}>
        <img className="logo-fundo-escuro" src={aparencia.logo || aparencia.logoEscuro} alt={empresa.nome} onError={() => setLogoFalhou(true)} />
        <img className="logo-fundo-claro" src={aparencia.logoEscuro || aparencia.logo} alt={empresa.nome} onError={() => setLogoFalhou(true)} />
      </Link>
    )

  return (
    <Link to="/" className="marca" aria-label={`${empresa.nome} — página inicial`}>
      <img className="marca-logo" src="/favicon.svg" alt="" width={40} height={40} />
      <span className="marca-texto">
        <strong>
          <span className="marca-azul">{primeira}</span>
          {resto && ` ${resto}`}
        </strong>
        <small>{empresa.slogan}</small>
      </span>
    </Link>
  )
}
