import { BadgeCheck, Clock, Store, Truck } from 'lucide-react'
import { Link } from '../components/Link'
import { useCatalogo } from '../lib/catalogo'
import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'
import ProductCard from '../components/ProductCard'
import ProductArt from '../components/ProductArt'
import MensagemAtendimento from '../components/MensagemAtendimento'
import ChipsCategorias from '../components/ChipsCategorias'
import SobMedida from '../components/SobMedida'
import { diasUteis } from '../lib/format'
import { useShell } from '../components/LojaShell'

export default function Home() {
  const { ehMobile, handle } = useShell()
  const { produtos, carregando } = useCatalogo()
  const { inicio, empresa } = useSite()
  // Destaques marcados na administração vêm primeiro; o resto segue a ordem do catálogo.
  const lista = [...produtos].sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque))
  const maisVendidos = produtos.filter((p) => p.maisVendido)

  // Fatos do destaque: só o que os dados sustentam (selo do admin, menor prazo do ERP, modo de entrega).
  const prazos = produtos.map((p) => p.prazoDias).filter((n): n is number => !!n)
  const temEnvio = produtos.some((p) => p.entregaModo === 'envio_e_retirada')
  const fatos = [
    inicio.selo ? { Icone: BadgeCheck, texto: inicio.selo } : null,
    prazos.length > 0 ? { Icone: Clock, texto: `Produção a partir de ${diasUteis(Math.min(...prazos))}` } : null,
    produtos.length > 0 ? { Icone: temEnvio ? Truck : Store, texto: temEnvio ? 'Retirada na loja ou envio' : 'Retirada na loja' } : null,
  ].filter((f) => f !== null)
  // Sem imagem própria, a coluna do destaque vira o orçamento sob medida (que já é a entrada de WhatsApp).
  const medidaNoDestaque = !inicio.imagem && !!empresa.whatsapp

  return (
    <>
      {ehMobile && <MensagemAtendimento />}
      {ehMobile && handle?.chips && <ChipsCategorias atual={null} />}
      <section className="hero">
        <div className="container hero-grade">
          <div>
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
              {inicio.botaoWhatsApp && empresa.whatsapp && !medidaNoDestaque && (
                <a className="btn btn-secundario" href={linkWhatsApp()} target="_blank" rel="noreferrer">
                  {inicio.botaoWhatsApp}
                </a>
              )}
            </div>
            {fatos.length > 0 && (
              <ul className="hero-fatos">
                {fatos.map(({ Icone, texto }) => (
                  <li key={texto}>
                    <Icone size={18} aria-hidden="true" />
                    {texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {medidaNoDestaque ? (
            <SobMedida />
          ) : (
            <div className="hero-arte" aria-hidden="true">
              {inicio.imagem ? <img src={inicio.imagem} alt="" /> : <ProductArt tipo="cartao" />}
            </div>
          )}
        </div>
      </section>
      {!medidaNoDestaque && inicio.imagem && empresa.whatsapp && (
        <section className="container secao-sob-medida">
          <SobMedida />
        </section>
      )}

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
                    <ProductCard key={p.slug} produto={p} />
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
                    <ProductCard key={p.slug} produto={p} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
    </>
  )
}
