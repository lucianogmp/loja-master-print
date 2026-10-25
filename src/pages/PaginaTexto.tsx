import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSite } from '../lib/site'
import TextoFormatado from '../lib/texto'

export default function PaginaTexto() {
  const { slug } = useParams()
  const { paginas, paginasCarregadas, empresa } = useSite()
  const pagina = paginas.find((p) => p.slug === slug)

  useEffect(() => {
    if (!pagina) return
    const antes = document.title
    document.title = `${pagina.titulo} — ${empresa.nome}`
    return () => {
      document.title = antes
    }
  }, [pagina, empresa.nome])

  if (!pagina) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">{paginasCarregadas ? 'Página não encontrada' : 'Carregando...'}</h1>
        {paginasCarregadas && (
          <Link to="/" className="btn btn-primario">
            Voltar ao início
          </Link>
        )}
      </div>
    )
  }
  return (
    <div className="container secao texto-pagina">
      <h1 className="titulo-pagina">{pagina.titulo}</h1>
      <TextoFormatado texto={pagina.conteudo} />
    </div>
  )
}
