import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from '../components/Link'
import { useShell } from '../components/LojaShell'
import { useTitulo } from '../lib/telas'
import { useSite } from '../lib/site'
import TextoFormatado from '../lib/texto'

export default function PaginaTexto() {
  const { slug } = useParams()
  const { paginas, paginasCarregadas, empresa } = useSite()
  const pagina = paginas.find((p) => p.slug === slug)
  const { ehMobile } = useShell()
  // No celular o título mora na barra de topo (h1); a página não repete
  useTitulo(pagina?.titulo ?? (paginasCarregadas ? 'Página não encontrada' : 'Página'))
  const Titulo = ehMobile ? 'h2' : 'h1'

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
        <Titulo className="titulo-pagina">{paginasCarregadas ? 'Página não encontrada' : 'Carregando...'}</Titulo>
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
      {!ehMobile && <h1 className="titulo-pagina">{pagina.titulo}</h1>}
      <TextoFormatado texto={pagina.conteudo} />
    </div>
  )
}
