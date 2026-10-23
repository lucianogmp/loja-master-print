import { useSearchParams } from 'react-router-dom'
import { categorias, produtos } from '../data/produtos'
import ProductCard from '../components/ProductCard'

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function Catalogo() {
  const [params] = useSearchParams()
  const categoria = params.get('categoria') ?? ''
  const busca = params.get('busca') ?? ''

  const termos = normalizar(busca).split(/\s+/).filter(Boolean)
  const lista = produtos.filter((p) => {
    if (categoria && p.categoria !== categoria) return false
    const alvo = normalizar(`${p.nome} ${p.resumo} ${p.descricao}`)
    return termos.every((t) => alvo.includes(t))
  })

  const nomeCategoria = categorias.find((c) => c.slug === categoria)?.nome

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">{nomeCategoria ?? 'Todos os produtos'}</h1>
      {busca && <p className="subtitulo">Resultados para “{busca}”</p>}

      {lista.length === 0 ? (
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
