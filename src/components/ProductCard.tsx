import { Link } from 'react-router-dom'
import type { Produto } from '../lib/tipos'
import { brl } from '../lib/format'
import ProductArt from './ProductArt'

// Preço no cartão: rótulo pequeno + valor em destaque (estilo marketplace)
function precoPartes(p: Produto): { rotulo?: string; valor: string; sufixo?: string } | null {
  if (p.tipoPreco === 'consulta') return null
  const menor = Math.min(...p.variacoes.map((v) => v.preco))
  if (p.tipoPreco === 'm2') return { rotulo: 'a partir de', valor: brl(menor), sufixo: '/m²' }
  if (p.tipoPreco === 'pacote') return { rotulo: 'a partir de', valor: brl(menor) }
  return { valor: brl(menor), sufixo: ' / un.' }
}

export default function ProductCard({ produto }: { produto: Produto }) {
  return (
    <Link to={`/produto/${produto.slug}`} className="card-produto">
      <div className="card-imagem">
        {produto.imagens[0] ? <img src={produto.imagens[0]} alt={produto.nome} loading="lazy" /> : <ProductArt tipo={produto.arte} />}
      </div>
      <div className="card-corpo">
        <h3>{produto.nome}</h3>
        <div className="card-preco">
          {(() => {
            const pr = precoPartes(produto)
            if (!pr) return <span className="sob-consulta">Sob consulta</span>
            return (
              <>
                {pr.rotulo && <small>{pr.rotulo}</small>}
                <strong>
                  {pr.valor}
                  {pr.sufixo && <small>{pr.sufixo}</small>}
                </strong>
              </>
            )
          })()}
        </div>
      </div>
    </Link>
  )
}
