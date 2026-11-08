import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from '../components/Link'
import SecaoOferta from '../components/SecaoOferta'
import { useShell } from '../components/LojaShell'
import { useCatalogo } from '../lib/catalogo'
import { diasParaOferta, tituloDaOferta, useOfertas } from '../lib/ofertas'
import { useSite } from '../lib/site'
import { useTitulo } from '../lib/telas'

export default function Oferta() {
  const { slug } = useParams()
  const { ofertas, carregando } = useOfertas()
  const { produtos, carregando: carregandoCatalogo } = useCatalogo()
  const { empresa } = useSite()
  const { ehMobile } = useShell()
  const oferta = ofertas.find((o) => o.slug === slug)
  const dias = oferta ? diasParaOferta(oferta) : null
  const titulo = oferta ? tituloDaOferta(oferta) : 'Ofertas'
  useTitulo(titulo)

  useEffect(() => {
    const antes = document.title
    document.title = `${titulo} — ${empresa.nome}`
    return () => {
      document.title = antes
    }
  }, [titulo, empresa.nome])

  const Titulo = ehMobile ? 'h2' : 'h1'
  const aguardando = carregando || carregandoCatalogo

  if (aguardando) return <div className="container secao centro"><p className="vazio">Carregando...</p></div>

  // Campanha que não existe, ou que não está no ar agora (fora da janela de datas): leva ao catálogo
  if (!oferta || dias === null) {
    return (
      <div className="container secao centro">
        <Titulo className="titulo-pagina">{oferta ? `${titulo} não está no ar agora` : 'Oferta não encontrada'}</Titulo>
        <p className="vazio">Veja todos os nossos produtos enquanto isso.</p>
        <Link to="/produtos" className="btn btn-primario">
          Ver produtos
        </Link>
      </div>
    )
  }

  const ids = new Set(oferta.produtos)
  const lista = produtos.filter((p) => ids.has(p.id) && !p.derivadoId)
  if (lista.length === 0) {
    return (
      <div className="container secao centro">
        <Titulo className="titulo-pagina">{titulo}</Titulo>
        <p className="vazio">Os produtos desta campanha estão sendo preparados.</p>
        <Link to="/produtos" className="btn btn-primario">
          Ver produtos
        </Link>
      </div>
    )
  }
  return <SecaoOferta oferta={oferta} dias={dias} produtos={lista} nivel={ehMobile ? 'h2' : 'h1'} />
}
