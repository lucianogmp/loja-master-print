import { Link } from './Link'
import type { Produto } from '../lib/tipos'
import { brl, diasUteis } from '../lib/format'
import ProductArt from './ProductArt'

// Preço no cartão: rótulo pequeno + valor em destaque (estilo marketplace)
function precoPartes(p: Produto): { rotulo?: string; valor: string; sufixo?: string } | null {
  if (p.tipoPreco === 'consulta') return null
  const menor = Math.min(...p.variacoes.map((v) => v.preco))
  if (p.tipoPreco === 'm2') return { rotulo: 'a partir de', valor: brl(menor), sufixo: '/m²' }
  if (p.tipoPreco === 'pacote') return { rotulo: 'a partir de', valor: brl(menor) }
  return { valor: brl(menor), sufixo: ' / un.' }
}

// nivel: h3 sob uma seção com h2 (Início); h2 direto sob o título da página (catálogo no computador)
export default function ProductCard({ produto, nivel = 'h3', selo }: { produto: Produto; nivel?: 'h2' | 'h3'; selo?: string }) {
  const Nome = nivel
  return (
    <Link to={`/produto/${produto.slug}`} className="card-produto">
      <div className="card-imagem">
        {produto.imagens[0] ? <img src={produto.imagens[0]} alt={produto.nome} loading="lazy" /> : <ProductArt tipo={produto.arte} />}
        {selo ? <span className="card-selo card-selo-destaque">{selo}</span> : produto.arteFixa && <span className="card-selo">Arte pronta</span>}
      </div>
      <div className="card-corpo">
        <Nome>{produto.nome}</Nome>
        {produto.prazoDias && <span className="card-prazo">Produção em {diasUteis(produto.prazoDias)}</span>}
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
