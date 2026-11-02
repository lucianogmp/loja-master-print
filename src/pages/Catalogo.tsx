import { useSearchParams } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import ProductCard from '../components/ProductCard'
import ChipsCategorias from '../components/ChipsCategorias'
import { useShell } from '../components/LojaShell'
import { useTitulo } from '../lib/telas'
import { buscarProdutos } from '../lib/buscaProdutos'

export default function Catalogo() {
  const { produtos, categorias, carregando, erro } = useCatalogo()
  const [params] = useSearchParams()
  const categoria = params.get('categoria') ?? ''
  const busca = params.get('busca') ?? ''

  const lista = buscarProdutos(
    produtos.filter((p) => !categoria || p.categoria === categoria),
    busca,
  )

  const nomeCategoria = categoria ? categorias.find((c) => c.slug === categoria)?.nome : undefined
  const { ehMobile, handle } = useShell()
  // No celular o título da tela fica na barra do alto (h1 de lá); aqui vira h2
  const Titulo = ehMobile ? 'h2' : 'h1'
  useTitulo(nomeCategoria ?? (busca ? 'Resultados' : 'Produtos'))

  return (
    <>
      {ehMobile && handle?.chips && <ChipsCategorias atual={categoria || undefined} />}
      <div className="container secao">
        <Titulo className="titulo-pagina">{nomeCategoria ?? 'Todos os produtos'}</Titulo>
        {busca && <p className="subtitulo">Resultados para “{busca}”</p>}

        {carregando ? (
          <p className="vazio">Carregando produtos...</p>
        ) : erro ? (
          <p className="vazio">Não foi possível carregar os produtos agora. Fale com a gente pelo WhatsApp.</p>
        ) : lista.length === 0 ? (
          <p className="vazio">Nenhum produto encontrado. Tente outra busca ou fale com a gente pelo WhatsApp.</p>
        ) : (
          <div className="grade-produtos">
            {lista.map((p) => (
              <ProductCard key={p.slug} produto={p} nivel={ehMobile ? 'h3' : 'h2'} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
