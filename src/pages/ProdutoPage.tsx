import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCatalogo } from '../lib/catalogo'
import { linkWhatsApp } from '../config'
import { brl } from '../lib/format'
import { useCart } from '../lib/cart'
import { areaM2, calcularTotal, rotuloArte, type OpcaoArte } from '../lib/preco'
import ProductArt from '../components/ProductArt'

export default function ProdutoPage() {
  const { slug = '' } = useParams()
  const { produtoPorSlug, categoriaPorSlug, carregando } = useCatalogo()
  const produto = produtoPorSlug(slug)
  const { adicionar } = useCart()
  const navigate = useNavigate()

  const [variacaoId, setVariacaoId] = useState(produto?.variacoes[0]?.id ?? '')
  const [quantidade, setQuantidade] = useState(1)
  const [largura, setLargura] = useState('')
  const [altura, setAltura] = useState('')
  const [arte, setArte] = useState<OpcaoArte>('propria')
  const [observacao, setObservacao] = useState('')

  if (carregando) return <div className="container secao">Carregando...</div>

  if (!produto) {
    return (
      <div className="container secao">
        <h1 className="titulo-pagina">Produto não encontrado</h1>
        <Link to="/produtos">Voltar ao catálogo</Link>
      </div>
    )
  }

  const larguraCm = Number(largura.replace(',', '.')) || undefined
  const alturaCm = Number(altura.replace(',', '.')) || undefined
  const ehM2 = produto.tipoPreco === 'm2'
  const sobConsulta = produto.tipoPreco === 'consulta'
  const total = calcularTotal(produto, { variacaoId, quantidade, larguraCm, alturaCm })
  const variacao = produto.variacoes.find((v) => v.id === variacaoId)
  const categoria = categoriaPorSlug(produto.categoria)
  const faltaMedida = ehM2 && (!larguraCm || !alturaCm)

  function adicionarAoCarrinho() {
    adicionar({ slug: produto!.slug, variacaoId, quantidade, larguraCm, alturaCm, arte: produto!.arteFixa ? 'modelo' : arte, observacao })
    navigate('/carrinho')
  }

  const mensagemConsulta =
    `Olá! Gostaria de um orçamento: ${produto.nome}` +
    (variacao ? ` (${variacao.label})` : '') +
    (ehM2 && larguraCm && alturaCm ? `, medida ${larguraCm} x ${alturaCm} cm` : '') +
    '.'

  return (
    <div className="container secao">
      <nav className="migalhas" aria-label="Você está aqui">
        <Link to="/">Início</Link> / <Link to="/produtos">Produtos</Link>
        {categoria && (
          <>
            {' '}
            / <Link to={`/produtos?categoria=${categoria.slug}`}>{categoria.nome}</Link>
          </>
        )}
      </nav>

      <div className="produto-grade">
        <div className="produto-imagem">
          {produto.imagens[0] ? (
            <img src={produto.imagens[0]} alt={produto.nome} />
          ) : (
            <>
              <ProductArt tipo={produto.arte} />
              <p className="legenda-imagem">Imagem ilustrativa</p>
            </>
          )}
        </div>

        <div className="produto-info">
          <h1>{produto.nome}</h1>
          <p className="produto-descricao">{produto.descricao}</p>
          {produto.entregaModo === 'so_retirada' && <p className="dica">Este produto é somente para retirada na gráfica.</p>}

          <div className="campo">
            <label htmlFor="variacao">{produto.rotuloVariacao}</label>
            <select id="variacao" value={variacaoId} onChange={(e) => setVariacaoId(e.target.value)}>
              {produto.variacoes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                  {produto.tipoPreco !== 'consulta' && produto.tipoPreco !== 'm2' ? ` — ${brl(v.preco)}` : ''}
                  {produto.tipoPreco === 'm2' ? ` — ${brl(v.preco)}/m²` : ''}
                </option>
              ))}
            </select>
          </div>

          {ehM2 && (
            <div className="campo-linha">
              <div className="campo">
                <label htmlFor="largura">Largura (cm)</label>
                <input
                  id="largura"
                  inputMode="decimal"
                  placeholder="ex.: 100"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="altura">Altura (cm)</label>
                <input
                  id="altura"
                  inputMode="decimal"
                  placeholder="ex.: 50"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                />
              </div>
            </div>
          )}
          {ehM2 && areaM2(larguraCm, alturaCm) > 0 && (
            <p className="dica">Área: {areaM2(larguraCm, alturaCm).toFixed(2).replace('.', ',')} m²</p>
          )}

          {!sobConsulta && (
            <div className="campo">
              <label htmlFor="quantidade">
                {produto.tipoPreco === 'pacote' ? 'Quantidade de pacotes' : 'Quantidade'}
              </label>
              <input
                id="quantidade"
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
              {produto.quantidadeFechada && (
                <span className="dica">Cada pacote tem {produto.quantidadeFechada} unidades.</span>
              )}
            </div>
          )}

          {produto.arteFixa && <p className="dica">Este produto já vem com a arte pronta: você só escolhe a quantidade.</p>}
          {produto.precisaArte && (
            <fieldset className="campo opcoes-arte">
              <legend>Sobre a arte</legend>
              {(Object.keys(rotuloArte) as OpcaoArte[]).map((op) => (
                <label key={op} className="radio">
                  <input type="radio" name="arte" checked={arte === op} onChange={() => setArte(op)} />
                  {rotuloArte[op]}
                </label>
              ))}
              <span className="dica">O envio do arquivo é combinado depois do pedido.</span>
            </fieldset>
          )}

          <div className="campo">
            <label htmlFor="obs">Observações (opcional)</label>
            <textarea
              id="obs"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Alguma informação importante sobre o pedido?"
            />
          </div>

          <div className="caixa-preco">
            {sobConsulta ? (
              <>
                <strong>Sob consulta</strong>
                <span>O valor depende do tamanho e das opções. Peça um orçamento pelo WhatsApp.</span>
              </>
            ) : total !== null ? (
              <>
                <span>Total</span>
                <strong>{brl(total)}</strong>
              </>
            ) : (
              <>
                <span>Total</span>
                <strong>—</strong>
                {faltaMedida && <span className="dica">Informe largura e altura para calcular.</span>}
              </>
            )}
            <span className="prazo">Prazo de produção: {produto.prazo}</span>
          </div>

          <div className="acoes-produto">
            {sobConsulta ? (
              <a className="btn btn-primario" href={linkWhatsApp(mensagemConsulta)} target="_blank" rel="noreferrer">
                Pedir orçamento pelo WhatsApp
              </a>
            ) : (
              <>
                <button className="btn btn-primario" onClick={adicionarAoCarrinho} disabled={total === null}>
                  Adicionar ao carrinho
                </button>
                <a className="btn btn-secundario" href={linkWhatsApp(mensagemConsulta)} target="_blank" rel="noreferrer">
                  Tirar dúvida
                </a>
              </>
            )}
          </div>
          <p className="aviso-exemplo">Preço de exemplo. O valor final será confirmado pela gráfica.</p>
        </div>
      </div>
    </div>
  )
}
