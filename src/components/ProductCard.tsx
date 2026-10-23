import { Link } from 'react-router-dom'
import type { Produto } from '../lib/tipos'
import { brl } from '../lib/format'
import ProductArt from './ProductArt'

export function textoPrecoInicial(p: Produto): string {
  if (p.tipoPreco === 'consulta') return 'Sob consulta'
  const menor = Math.min(...p.variacoes.map((v) => v.preco))
  if (p.tipoPreco === 'm2') return `a partir de ${brl(menor)}/m²`
  if (p.tipoPreco === 'pacote') return `a partir de ${brl(menor)}`
  return `a partir de ${brl(menor)} / un.`
}

export default function ProductCard({ produto }: { produto: Produto }) {
  return (
    <Link to={`/produto/${produto.slug}`} className="card-produto">
      <div className="card-imagem">
        {produto.imagens[0] ? <img src={produto.imagens[0]} alt={produto.nome} loading="lazy" /> : <ProductArt tipo={produto.arte} />}
      </div>
      <div className="card-corpo">
        <h3>{produto.nome}</h3>
        <p>{produto.resumo}</p>
        <div className="card-preco">{textoPrecoInicial(produto)}</div>
      </div>
    </Link>
  )
}
