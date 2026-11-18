import { Link } from '../components/Link'
import { useCatalogo } from '../lib/catalogo'
import { brl } from '../lib/format'
import { useCart } from '../lib/cart'
import { calcularTotal, rotuloArte } from '../lib/preco'
import ProductArt from '../components/ProductArt'
import { useFreteCarrinho } from '../lib/freteCarrinho'
import { mascaraCep } from '../lib/enderecos'

export default function Carrinho() {
  const { itens, remover, subtotal, temSobConsulta } = useCart()
  const { produtoPorSlug } = useCatalogo()
  const fr = useFreteCarrinho(itens)

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
            if (!produto)
              return (
                <li key={item.id} className="item-carrinho item-indisponivel">
                  <div className="item-info">
                    <h3>Produto indisponível</h3>
                    <p className="dica">Este item saiu do catálogo e não entra no subtotal.</p>
                    <button className="link-botao" onClick={() => remover(item.id)}>
                      Remover
                    </button>
                  </div>
                </li>
              )
            const variacao = produto.variacoes.find((v) => v.id === item.variacaoId)
            const total = calcularTotal(produto, item)
            return (
              <li key={item.id} className="item-carrinho">
                <div className="item-imagem">
                  {produto.imagens[0] ? <img src={produto.imagens[0]} alt={produto.nome} /> : <ProductArt tipo={produto.arte} />}
                </div>
                <div className="item-info">
                  <h3>{produto.nome}</h3>
                  <p>
                    {variacao?.label}
                    {item.larguraCm && item.alturaCm ? ` · ${item.larguraCm} x ${item.alturaCm} cm` : ''}
                    {!produto.temOpcoes && <>{' · '}Qtd. {item.quantidade}</>}
                  </p>
                  <p className="dica">{produto.arteFixa ? 'Arte pronta do produto' : rotuloArte[item.arte]}</p>
                  {item.observacao && <p className="dica">Obs.: {item.observacao}</p>}
                  <button className="link-botao" onClick={() => remover(item.id)}>
                    Remover
                  </button>
                </div>
                <div className="item-valor">
                  {total !== null && (variacao?.precoOriginal ?? produto.precoOriginal) && (
                    <s className="preco-de" aria-label={`de ${brl((variacao?.precoOriginal ?? produto.precoOriginal ?? 0) * item.quantidade)}`}>
                      {brl((variacao?.precoOriginal ?? produto.precoOriginal ?? 0) * item.quantidade)}
                    </s>
                  )}
                  {total === null ? 'Sob consulta' : brl(total)}
                </div>
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
          {fr.disponivel ? (
            <div className="frete-carrinho">
              <label htmlFor="cep-carrinho">Calcular frete (CEP)</label>
              <input id="cep-carrinho" inputMode="numeric" placeholder="00000-000" value={mascaraCep(fr.cep)} onChange={(e) => fr.setCep(e.target.value)} autoComplete="postal-code" />
              {fr.cep.length !== 8 && <span className="dica">Digite o CEP para ver o valor e o prazo.</span>}
              {fr.carregando && <span className="dica">Calculando o frete...</span>}
              {fr.erro && <span className="dica" role="alert">{fr.erro}{fr.detalhe ? <><br /><small>Motivo: {fr.detalhe}</small></> : null}</span>}
              {fr.opcoes.map((o) => (
                <label key={o.codigo} className="radio">
                  <input type="radio" name="frete-carrinho" checked={fr.escolhida?.codigo === o.codigo} onChange={() => fr.escolher(o.codigo)} />
                  <span>
                    <strong>{o.nome}</strong> — {o.valor === 0 ? 'Grátis' : brl(o.valor)}
                    {o.prazo ? <small> · {o.prazo} dia(s) úteis</small> : null}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="linha-resumo">
              <span>Frete</span>
              <span>{fr.soRetirada || fr.semEnvio.length > 0 ? 'Retirada ou combinado com a gráfica' : 'Combinado no fechamento'}</span>
            </div>
          )}
          {fr.disponivel && fr.escolhida && (
            <>
              <div className="linha-resumo">
                <span>Frete ({fr.escolhida.nome})</span>
                <strong>{fr.escolhida.valor === 0 ? 'Grátis' : brl(fr.escolhida.valor)}</strong>
              </div>
              <div className="linha-resumo">
                <span>Total</span>
                <strong>{brl(subtotal + fr.escolhida.valor)}</strong>
              </div>
            </>
          )}
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
