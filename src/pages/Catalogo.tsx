import { useSearchParams } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import ProductCard from '../components/ProductCard'

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function Catalogo() {
  const { produtos, categorias, grupos, carregando, erro } = useCatalogo()
  const [params, setParams] = useSearchParams()
  const grupo = params.get('grupo') ?? ''
  const categoria = params.get('categoria') ?? ''
  const busca = params.get('busca') ?? ''

  const termos = normalizar(busca).split(/\s+/).filter(Boolean)
  const lista = produtos.filter((p) => {
    if (grupo && p.grupo !== grupo) return false
    if (categoria && p.categoria !== categoria) return false
    const alvo = normalizar(`${p.nome} ${p.resumo} ${p.descricao}`)
    return termos.every((t) => alvo.includes(t))
  })

  const nomeGrupo = grupos.find((g) => g.slug === grupo)?.nome
  const subcategorias = categorias.filter((c) => c.grupo === grupo)
  const nomeCategoria = categoria ? categorias.find((c) => c.slug === categoria)?.nome : undefined

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">{nomeCategoria ?? nomeGrupo ?? 'Todos os produtos'}</h1>
      {subcategorias.length > 1 && (
        <div className="filtros" role="group" aria-label="Filtrar por categoria">
          <button className={!categoria ? 'ativo' : ''} onClick={() => setParams({ grupo })}>
            Todas
          </button>
          {subcategorias.map((c) => (
            <button key={c.slug} className={categoria === c.slug ? 'ativo' : ''} onClick={() => setParams({ grupo, categoria: c.slug })}>
              {c.nome}
            </button>
          ))}
        </div>
      )}
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
