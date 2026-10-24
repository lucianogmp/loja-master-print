import { useSearchParams } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import ProductCard from '../components/ProductCard'

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function Catalogo() {
  const { produtos, categorias, carregando, erro } = useCatalogo()
  const [params] = useSearchParams()
  const categoria = params.get('categoria') ?? ''
  const busca = params.get('busca') ?? ''

  const termos = normalizar(busca).split(/\s+/).filter(Boolean)
  const lista = produtos.filter((p) => {
    if (categoria && p.categoria !== categoria) return false
    const alvo = normalizar(`${p.nome} ${p.resumo} ${p.descricao}`)
    return termos.every((t) => alvo.includes(t))
  })

  const nomeCategoria = categoria ? categorias.find((c) => c.slug === categoria)?.nome : undefined

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">{nomeCategoria ?? 'Todos os produtos'}</h1>
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
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
      )}
    </div>
  )
}
