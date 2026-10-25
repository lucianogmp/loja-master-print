import { Link } from 'react-router-dom'
import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'

export default function Footer() {
  const { empresa, paginas } = useSite()
  const noRodape = paginas.filter((p) => p.no_rodape)
  return (
    <footer className="footer">
      <div className="container footer-grade">
        <div>
          <h3>{empresa.nome}</h3>
          {empresa.textoRodape && <p>{empresa.textoRodape}</p>}
        </div>
        <div>
          <h4>Loja</h4>
          <ul>
            <li>
              <Link to="/produtos">Todos os produtos</Link>
            </li>
            <li>
              <Link to="/carrinho">Carrinho</Link>
            </li>
            <li>
              <Link to="/atendimento">Atendimento e informações</Link>
            </li>
            {noRodape.map((p) => (
              <li key={p.slug}>
                <Link to={`/pagina/${p.slug}`}>{p.titulo}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Fale com a gente</h4>
          <ul>
            <li>
              <a href={linkWhatsApp()} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            {empresa.email && (
              <li>
                <a href={`mailto:${empresa.email}`}>{empresa.email}</a>
              </li>
            )}
            {empresa.instagram && (
              <li>
                <a href={empresa.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {empresa.facebook && (
              <li>
                <a href={empresa.facebook} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            )}
            <li>{empresa.horario}</li>
            {empresa.endereco && <li>{empresa.endereco}</li>}
          </ul>
        </div>
      </div>
      <div className="footer-fim">
        <div className="container">
          © {new Date().getFullYear()} {empresa.nome}. Todos os direitos reservados. · <Link to="/admin">Administração</Link>
        </div>
      </div>
    </footer>
  )
}
