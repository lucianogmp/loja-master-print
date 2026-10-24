import { Link } from 'react-router-dom'
import { LOJA, linkWhatsApp } from '../config'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grade">
        <div>
          <h3>{LOJA.nome}</h3>
          <p>Impressos e comunicação visual com atendimento de verdade.</p>
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
          </ul>
        </div>
        <div>
          <h4>Fale com a gente</h4>
          <ul>
            <li>
              <a href={linkWhatsApp('Olá! Vim pelo site da Master Print.')} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li>{LOJA.horario}</li>
          </ul>
        </div>
      </div>
      <div className="footer-fim">
        <div className="container">
          © {new Date().getFullYear()} {LOJA.nome}. Todos os direitos reservados. · <Link to="/admin">Administração</Link>
        </div>
      </div>
    </footer>
  )
}
