import { Link } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import { linkWhatsApp } from '../config'
import ProductCard from '../components/ProductCard'
import ProductArt from '../components/ProductArt'

export default function Home() {
  const { produtos, categorias } = useCatalogo()
  const destaques = produtos.filter((p) => p.destaque)

  return (
    <>
      <section className="hero">
        <div className="container hero-grade">
          <div>
            <span className="selo">Gráfica online</span>
            <h1>
              Imprima do seu jeito, <span className="texto-gradiente">receba sem complicação.</span>
            </h1>
            <p>
              Cartões de visita, adesivos, banners, impressos, placas e quadros. Escolha o produto,
              informe as medidas e peça pelo site ou pelo WhatsApp.
            </p>
            <div className="hero-acoes">
              <Link to="/produtos" className="btn btn-primario">
                Ver produtos
              </Link>
              <a
                className="btn btn-secundario"
                href={linkWhatsApp('Olá! Vim pelo site da Master Print.')}
                target="_blank"
                rel="noreferrer"
              >
                Falar com a gráfica
              </a>
            </div>
          </div>
          <div className="hero-arte" aria-hidden="true">
            <ProductArt tipo="cartao" />
          </div>
        </div>
      </section>

      <section className="faixa-beneficios">
        <div className="container beneficios">
          <div>
            <strong>Atendimento humano</strong>
            <span>Tire dúvidas e acerte detalhes pelo WhatsApp.</span>
          </div>
          <div>
            <strong>Retirada ou entrega</strong>
            <span>Combine a melhor forma de receber seu pedido.</span>
          </div>
          <div>
            <strong>Ajuda com a arte</strong>
            <span>Não tem arte pronta? A gente te ajuda.</span>
          </div>
        </div>
      </section>

      {categorias.length > 0 && (
      <section className="secao container">
        <h2>Categorias</h2>
        <div className="grade-categorias">
          {categorias.map((c) => (
            <Link key={c.slug} to={`/produtos?categoria=${c.slug}`} className="card-categoria">
              <ProductArt tipo={c.arte} />
              <span>{c.nome}</span>
            </Link>
          ))}
        </div>
      </section>
      )}

      {destaques.length > 0 && (
      <section className="secao container">
        <div className="secao-topo">
          <h2>Mais pedidos</h2>
          <Link to="/produtos">Ver todos →</Link>
        </div>
        <div className="grade-produtos">
          {destaques.map((p) => (
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
        <p className="aviso-exemplo">Produtos e preços de exemplo, apenas para visualizar o layout.</p>
      </section>
      )}
    </>
  )
}
