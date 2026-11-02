import { useEffect, useRef } from 'react'
import { Link } from './Link'
import { useCatalogo } from '../lib/catalogo'

type Props = {
  /** Categoria em destaque: slug, `undefined` = "Todos", `null` = nenhuma (fora do catálogo). */
  atual?: string | null
  /** Faixa do cabeçalho do computador (`.categorias-lista`) em vez das fichas do celular (`.chips`). */
  faixa?: boolean
}

export default function ChipsCategorias({ atual, faixa = false }: Props) {
  const { categorias } = useCatalogo()
  const ativoRef = useRef<HTMLAnchorElement>(null)

  // No celular, a ficha ativa aparece na tela mesmo quando está lá no fim da fileira
  // (roda quando a fileira surge, já que o catálogo pode chegar depois da montagem)
  const temFichas = categorias.length > 0
  useEffect(() => {
    if (!faixa && temFichas) ativoRef.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [faixa, temFichas])

  if (!faixa && categorias.length === 0) return null

  const links = [{ slug: undefined as string | undefined, nome: 'Todos' }, ...categorias].map((c) => {
    const ativo = atual !== null && atual === c.slug
    return (
      <Link
        key={c.slug ?? ''}
        ref={ativo ? ativoRef : undefined}
        to={c.slug ? `/produtos?categoria=${c.slug}` : '/produtos'}
        className={ativo ? 'ativo' : ''}
      >
        {c.nome}
      </Link>
    )
  })

  if (faixa)
    return (
      <nav className="categorias" aria-label="Categorias">
        <div className="container categorias-lista">{links}</div>
      </nav>
    )
  return (
    <nav className="chips" aria-label="Categorias">
      {links}
    </nav>
  )
}
