import { Link } from '../components/Link'
import { useShell } from '../components/LojaShell'

export default function NaoEncontrada() {
  const { ehMobile } = useShell()
  return (
    <div className="container secao centro">
      {/* No celular o título já está na barra do alto */}
      {ehMobile ? (
        <p className="subtitulo">Não encontramos o que você procurava.</p>
      ) : (
        <h1 className="titulo-pagina">Página não encontrada</h1>
      )}
      <Link to="/" className="btn btn-primario">
        Voltar ao início
      </Link>
    </div>
  )
}
