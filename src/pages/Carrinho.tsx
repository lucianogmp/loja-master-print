import { Link } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import { brl } from '../lib/format'
import { useCart } from '../lib/cart'
import { calcularTotal, rotuloArte } from '../lib/preco'
import ProductArt from '../components/ProductArt'

export default function Carrinho() {
  const { itens, remover, subtotal, temSobConsulta } = useCart()
  const { produtoPorSlug } = useCatalogo()

  if (itens.length === 0) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Seu carrinho está vazio</h1>
        <p className="subtitulo">Escolha um produto para começar.</p>
        <Link to="/produtos" className="btn btn-primario">
          Ver produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">Carrinho</h1>
      <div className="carrinho-grade">
        <ul className="lista-carrinho">
          {itens.map((item) => {
            const produto = produtoPorSlug(item.slug)
            if (!produto) return null
            const variacao = produto.variacoes.find((v) => v.id === item.variacaoId)
            const total = calcularTotal(produto, item)
            return (
              <li key={item.id} className="item-carrinho">
                <div className="item-imagem">
                  <ProductArt tipo={produto.arte} />
                </div>
                <div className="item-info">
                  <h3>{produto.nome}</h3>
                  <p>
                    {variacao?.label}
                    {item.larguraCm && item.alturaCm ? ` · ${item.larguraCm} x ${item.alturaCm} cm` : ''}
                    {' · '}Qtd. {item.quantidade}
                  </p>
                  <p className="dica">{rotuloArte[item.arte]}</p>
                  {item.observacao && <p className="dica">Obs.: {item.observacao}</p>}
                  <button className="link-botao" onClick={() => remover(item.id)}>
                    Remover
                  </button>
                </div>
                <div className="item-valor">{total === null ? 'Sob consulta' : brl(total)}</div>
              </li>
            )
          })}
        </ul>

        <aside className="resumo">
          <h2>Resumo</h2>
          <div className="linha-resumo">
            <span>Subtotal</span>
            <strong>{brl(subtotal)}</strong>
          </div>
          <div className="linha-resumo">
            <span>Frete</span>
            <span>Combinado no fechamento</span>
          </div>
          {temSobConsulta && <p className="dica">Há itens sob consulta que não entram no subtotal.</p>}
          <Link to="/checkout" className="btn btn-primario btn-bloco">
            Finalizar pedido
          </Link>
          <Link to="/produtos" className="link-botao">
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
