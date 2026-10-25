import { Link } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'
import ProductCard from '../components/ProductCard'
import ProductArt from '../components/ProductArt'

export default function Home() {
  const { produtos, carregando } = useCatalogo()
  const { inicio } = useSite()
  // Destaques marcados na administração vêm primeiro; o resto segue a ordem do catálogo.
  const lista = [...produtos].sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque))
  const maisVendidos = produtos.filter((p) => p.maisVendido)

  return (
    <>
      <section className="hero">
        <div className="container hero-grade">
          <div>
            {inicio.selo && <span className="selo">{inicio.selo}</span>}
            <h1>
              {inicio.titulo} <span className="texto-gradiente">{inicio.tituloDestaque}</span>
            </h1>
            {inicio.texto && <p>{inicio.texto}</p>}
            <div className="hero-acoes">
              {inicio.botaoPrincipal && (
                <Link to="/produtos" className="btn btn-primario">
                  {inicio.botaoPrincipal}
                </Link>
              )}
              {inicio.botaoWhatsApp && (
                <a className="btn btn-secundario" href={linkWhatsApp()} target="_blank" rel="noreferrer">
                  {inicio.botaoWhatsApp}
                </a>
              )}
            </div>
          </div>
          <div className="hero-arte" aria-hidden="true">
            {inicio.imagem ? <img src={inicio.imagem} alt="" /> : <ProductArt tipo="cartao" />}
          </div>
        </div>
      </section>

      {inicio.secoes
        .filter((s) => s.visivel)
        .map((s) => {
          if (s.id === 'beneficios')
            return (
              <section key={s.id} className="faixa-beneficios">
                <div className="container beneficios">
                  {inicio.beneficios
                    .filter((b) => b.titulo || b.texto)
                    .map((b, i) => (
                      <div key={i}>
                        <strong>{b.titulo}</strong>
                        <span>{b.texto}</span>
                      </div>
                    ))}
                </div>
              </section>
            )
          if (s.id === 'mais_vendidos')
            return maisVendidos.length > 0 ? (
              <section key={s.id} className="secao container">
                <div className="secao-topo">
                  <h2>{s.titulo}</h2>
                </div>
                <div className="grade-produtos">
                  {maisVendidos.map((p) => (
                    <ProductCard key={p.id} produto={p} />
                  ))}
                </div>
              </section>
            ) : null
          return (
            <section key={s.id} className="secao container">
              <div className="secao-topo">
                <h2>{s.titulo}</h2>
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
          )
        })}
    </>
  )
}
