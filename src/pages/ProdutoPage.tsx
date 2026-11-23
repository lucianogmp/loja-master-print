import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link, useNavegar } from '../components/Link'
import { useCatalogo } from '../lib/catalogo'
import { useSite } from '../lib/site'
import { linkWhatsApp } from '../config'
import { brl } from '../lib/format'
import { explicarImpressao } from '../lib/impressao'
import { percentualDesconto } from '../lib/promocao'
import { useCart } from '../lib/cart'
import { areaM2, calcularTotal, rotuloArte, type OpcaoArte } from '../lib/preco'
import { useAjustes } from '../lib/ajustes'
import { envioPronto } from '../lib/envio'
import Compartilhar from '../components/Compartilhar'
import ProductArt from '../components/ProductArt'
import { useShell } from '../components/LojaShell'
import { useTitulo } from '../lib/telas'

export default function ProdutoPage() {
  const { slug = '' } = useParams()
  const { produtoPorSlug, categoriaPorSlug, carregando } = useCatalogo()
  const produto = produtoPorSlug(slug)
  const { adicionar } = useCart()
  const { empresa } = useSite()
  const navegar = useNavegar()
  const { ajustes } = useAjustes()
  const { ehMobile } = useShell()
  useTitulo(produto?.nome ?? 'Produto')

  // A escolha vale só se existir no produto: aberto por link, o produto chega depois do primeiro render.
  const [variacaoEscolhida, setVariacaoId] = useState('')
  const [escolhaA, setEscolhaA] = useState('')
  const [escolhaB, setEscolhaB] = useState('')
  const [quantidadeDigitada, setQuantidade] = useState(1)
  const [largura, setLargura] = useState('')
  const [altura, setAltura] = useState('')
  const [arte, setArte] = useState<OpcaoArte>('propria')
  const [observacao, setObservacao] = useState('')

  if (carregando) return <div className="container secao">Carregando...</div>

  if (!produto) {
    return (
      <div className="container secao">
        {ehMobile ? <h2 className="titulo-pagina">Produto não encontrado</h2> : <h1 className="titulo-pagina">Produto não encontrado</h1>}
        <Link to="/produtos">Voltar ao catálogo</Link>
      </div>
    )
  }

  // Grupo: dois seletores (ex.: impressão e quantidade). A opção válida é sempre uma combinação que existe.
  const ordenados = (xs: string[]) => [...new Set(xs.filter(Boolean))]
  const opcoesA = ordenados(produto.variacoes.map((v) => v.a ?? ''))
  const a = opcoesA.includes(escolhaA) ? escolhaA : (opcoesA[0] ?? '')
  const doA = produto.variacoes.filter((v) => (v.a ?? '') === a)
  const opcoesB = ordenados(doA.map((v) => v.b ?? ''))
  const b = opcoesB.includes(escolhaB) ? escolhaB : (opcoesB[0] ?? '')
  const doGrupo = produto.grupo ? (doA.find((v) => (v.b ?? '') === b) ?? doA[0]) : undefined
  const variacaoId = doGrupo
    ? doGrupo.id
    : produto.variacoes.some((v) => v.id === variacaoEscolhida)
      ? variacaoEscolhida
      : (produto.variacoes[0]?.id ?? '')
  const larguraCm = Number(largura.replace(',', '.')) || undefined
  const alturaCm = Number(altura.replace(',', '.')) || undefined
  // Com quantidades fechadas o cliente escolhe a opção (250, 500...): é sempre 1 pacote dela
  const quantidade = produto.temOpcoes ? 1 : quantidadeDigitada
  const ehM2 = produto.tipoPreco === 'm2'
  const sobConsulta = produto.tipoPreco === 'consulta'
  const total = calcularTotal(produto, { variacaoId, quantidade, larguraCm, alturaCm })
  const variacao = produto.variacoes.find((v) => v.id === variacaoId)
  const precoOriginal = produto.grupo ? variacao?.precoOriginal : produto.precoOriginal
  // Em grupo, a foto muda com a opção escolhida (usa a foto do produto daquela opção; sem foto, a do grupo)
  const imagemAtual = (produto.grupo ? variacao?.imagens?.[0] : undefined) ?? produto.imagens[0]
  const explicaImpressao = produto.grupo ? explicarImpressao(a) : null
  const detalheOpcao = produto.grupo && variacao?.descricao && variacao.descricao !== produto.descricao ? variacao.descricao : ''
  const categoria = categoriaPorSlug(produto.categoria)
  const faltaMedida = ehM2 && (!larguraCm || !alturaCm)
  const motivoBloqueio =
    total !== null ? null : faltaMedida ? 'Informe a largura e a altura para calcular o total.' : 'Escolha as opções do produto para calcular o total.'

  function adicionarAoCarrinho() {
    adicionar({ slug: produto!.slug, variacaoId, quantidade, larguraCm, alturaCm, arte: produto!.arteFixa ? 'modelo' : arte, observacao })
    navegar('/carrinho')
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
          {imagemAtual ? (
            <img src={imagemAtual} alt={produto.nome} />
          ) : (
            <>
              <ProductArt tipo={produto.arte} />
              <p className="legenda-imagem">Imagem ilustrativa</p>
            </>
          )}
        </div>

        <div className="produto-info">
          {ehMobile ? <h2>{produto.nome}</h2> : <h1>{produto.nome}</h1>}
          <p className="produto-descricao">{produto.descricao}</p>
          <Compartilhar titulo={produto.nome} />
          {produto.entregaModo === 'so_retirada' && <p className="dica">Este produto é somente para retirada na gráfica.</p>}
          {produto.entregaModo !== 'so_retirada' && ajustes.frete.ligado && !envioPronto(produto, variacaoId) && (
            <p className="dica">Envio pelos Correios indisponível para este produto: retirada na gráfica.</p>
          )}

          {produto.grupo ? (
            <>
              {produto.grupo.rotuloA && (
                <fieldset className="campo seletor-variacao">
                  <legend>{produto.grupo.rotuloA}: <strong>{a}</strong></legend>
                  <div className="chips-variacao">
                    {opcoesA.map((o) => (
                      <button key={o} type="button" className={`chip-variacao${o === a ? ' ativo' : ''}`} aria-pressed={o === a} onClick={() => setEscolhaA(o)}>{o}</button>
                    ))}
                  </div>
                  {explicaImpressao && <p className="dica explica-opcao"><strong>{a}:</strong> {explicaImpressao}</p>}
                </fieldset>
              )}
              {produto.grupo.rotuloB && (
                <fieldset className="campo seletor-variacao">
                  <legend>{produto.grupo.rotuloB}: <strong>{b}</strong></legend>
                  <div className="chips-variacao">
                    {opcoesB.map((o) => {
                      const v = doA.find((x) => (x.b ?? '') === o)
                      return (
                        <button key={o} type="button" className={`chip-variacao${o === b ? ' ativo' : ''}`} aria-pressed={o === b} onClick={() => setEscolhaB(o)}>
                          {o}
                          {v && <small>{brl(v.preco)}</small>}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}
              {detalheOpcao && <p className="dica detalhe-opcao">{detalheOpcao}</p>}
            </>
          ) : (
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
          )}

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

          {!sobConsulta && !produto.temOpcoes && (
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
                <span>
                  Total
                  {precoOriginal && <span className="badge-promo">-{percentualDesconto(precoOriginal, variacao?.preco ?? 0)}%</span>}
                </span>
                {precoOriginal && (
                  <s className="preco-de" aria-label={`de ${brl(precoOriginal * quantidade)}`}>
                    {brl(precoOriginal * quantidade)}
                  </s>
                )}
                <strong>{brl(total)}</strong>
              </>
            ) : (
              <>
                <span>Total</span>
                <strong>—</strong>
              </>
            )}
            <span className="prazo">Prazo de produção: {variacao?.prazo ?? produto.prazo}</span>
          </div>

          <div className="acoes-produto">
            {sobConsulta ? (
              empresa.whatsapp && (
                <a className="btn btn-primario" href={linkWhatsApp(mensagemConsulta)} target="_blank" rel="noreferrer">
                  Pedir orçamento no WhatsApp
                </a>
              )
            ) : (
              <>
                <button
                  className="btn btn-primario"
                  onClick={adicionarAoCarrinho}
                  disabled={total === null}
                  aria-describedby={motivoBloqueio ? 'motivo-bloqueio' : undefined}
                >
                  Adicionar ao carrinho
                </button>
                {empresa.whatsapp && (
                  <a className="btn btn-secundario" href={linkWhatsApp(mensagemConsulta)} target="_blank" rel="noreferrer">
                    Tirar dúvida no WhatsApp
                  </a>
                )}
              </>
            )}
          </div>
          {!sobConsulta && motivoBloqueio && (
            <p id="motivo-bloqueio" className="dica motivo-bloqueio">
              {motivoBloqueio}
            </p>
          )}
          <p className="aviso-exemplo">O valor final é confirmado pela gráfica no WhatsApp, junto com o pagamento e a entrega.</p>
        </div>
      </div>
    </div>
  )
}
