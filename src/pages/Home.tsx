import { Link } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import { linkWhatsApp } from '../config'
import ProductCard from '../components/ProductCard'
import ProductArt from '../components/ProductArt'

export default function Home() {
  const { produtos, carregando } = useCatalogo()
  // Destaques marcados na administração vêm primeiro; o resto segue a ordem do catálogo.
  const lista = [...produtos].sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque))
  const maisVendidos = produtos.filter((p) => p.maisVendido)

  return (
    <>
      <section className="hero">
        <div className="container hero-grade">
          <div>
            <span className="selo">Gráfica online</span>
            <h1>
              Ideias boas merecem <span className="texto-gradiente">uma boa impressão.</span>
            </h1>
            <p>
              Materiais gráficos e personalizados para sua marca, seu negócio e seus momentos
              especiais. Peça pelo site ou pelo WhatsApp
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

      {maisVendidos.length > 0 && (
        <section className="secao container">
          <div className="secao-topo">
            <h2>Mais vendidos</h2>
          </div>
          <div className="grade-produtos">
            {maisVendidos.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        </section>
      )}

      <section className="secao container">
        <div className="secao-topo">
          <h2>Produtos</h2>
          <Link to="/produtos">Ver todos →</Link>
        </div>
        {carregando ? (
          <p className="vazio">Carregando produtos...</p>
        ) : lista.length === 0 ? (
          <p className="vazio">Em breve novos produtos. Fale com a gente pelo WhatsApp.</p>
        ) : (
          <div className="grade-produtos">
            {lista.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
