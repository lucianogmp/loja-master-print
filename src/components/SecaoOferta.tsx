import { CalendarHeart } from 'lucide-react'
import { Link } from './Link'
import ProductCard from './ProductCard'
import { textoDias } from '../lib/datasComerciais'
import { tituloDaOferta, type Oferta } from '../lib/ofertas'
import { useEhAdmin } from '../lib/erpAdmin'
import type { Produto } from '../lib/tipos'

type Props = {
  oferta: Oferta
  dias: number
  produtos: Produto[]
  /** Na página inicial mostra só os primeiros e leva à página da oferta */
  limite?: number
  nivel?: 'h1' | 'h2'
}

/** Faixa de uma oferta de data comercial: título, contagem de dias, texto e produtos. */
export default function SecaoOferta({ oferta, dias, produtos, limite, nivel = 'h2' }: Props) {
  const Titulo = nivel
  // A contagem de dias é só para quem organiza a oferta; o cliente não vê
  const ehAdmin = useEhAdmin()
  const lista = limite ? produtos.slice(0, limite) : produtos
  return (
    <section className="secao container" aria-label={tituloDaOferta(oferta)}>
      <div className="oferta-bloco">
        <div className="oferta-cabeca">
          {ehAdmin && (
            <span className="oferta-selo" title="Só você, administrador, vê esta contagem">
              <CalendarHeart size={16} aria-hidden="true" />
              {textoDias(dias)}
            </span>
          )}
          <Titulo className="oferta-titulo">{tituloDaOferta(oferta)}</Titulo>
          {oferta.texto && <p className="oferta-texto">{oferta.texto}</p>}
        </div>
        <div className="grade-produtos">
          {lista.map((p) => (
            <ProductCard key={p.slug} produto={p} />
          ))}
        </div>
        {limite && produtos.length > limite && (
          <Link to={`/oferta/${oferta.slug}`} className="btn btn-secundario oferta-mais">
            Ver todas as ofertas ({produtos.length}) →
          </Link>
        )}
      </div>
    </section>
  )
}
