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
import BannerCarrossel from '../components/BannerCarrossel'
import SecaoOferta from '../components/SecaoOferta'
import { diasParaOferta, useOfertas } from '../lib/ofertas'
import { diasUteis } from '../lib/format'
import { useShell } from '../components/LojaShell'

export default function Home() {
  const { ehMobile, handle } = useShell()
  const { produtos, carregando } = useCatalogo()
  const { inicio, empresa } = useSite()
  const { ofertas } = useOfertas()
  // Destaques marcados na administração ganham um bloco logo no topo; com o bloco ligado, não se repetem na lista geral.
  const destaques = produtos.filter((p) => p.destaque && !p.derivadoId)
  const blocoDestaques = inicio.secoes.some((s) => s.id === 'destaques' && s.visivel) && destaques.length > 0
  const lista = blocoDestaques ? produtos.filter((p) => !destaques.includes(p)) : produtos
  // Ofertas no ar (data comercial dentro da janela e com produtos no catálogo), a mais próxima primeiro
  const ofertasNoAr = ofertas
    .map((o) => {
      const ids = new Set(o.produtos)
      return { oferta: o, dias: diasParaOferta(o), produtos: produtos.filter((p) => ids.has(p.id) && !p.derivadoId) }
    })
    .filter((x): x is typeof x & { dias: number } => x.dias !== null && x.produtos.length > 0)
    .sort((a, b) => a.dias - b.dias)
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
      <BannerCarrossel />
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

      {/* Ofertas vêm sempre logo abaixo do destaque do topo, antes de Destaques e Mais vendidos */}
      {inicio.secoes.some((s) => s.id === 'ofertas' && s.visivel) &&
        ofertasNoAr.map((x) => (
          <SecaoOferta key={x.oferta.id} oferta={x.oferta} dias={x.dias} produtos={x.produtos} limite={8} />
        ))}

      {inicio.secoes
        .filter((s) => s.visivel)
        .map((s) => {
          if (s.id === 'destaques')
            return blocoDestaques ? (
              <section key={s.id} className="secao container bloco-destaques" aria-label={s.titulo}>
                <div className="secao-topo">
                  <h2>{s.titulo}</h2>
                </div>
                <div className="grade-produtos">
                  {destaques.map((p) => (
                    <ProductCard key={p.slug} produto={p} selo="Destaque" />
                  ))}
                </div>
              </section>
            ) : null
          if (s.id === 'ofertas') return null
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
              ) : lista.length === 0 && blocoDestaques ? null : lista.length === 0 ? (
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
