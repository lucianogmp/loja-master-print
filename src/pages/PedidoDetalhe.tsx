import { useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Link } from '../components/Link'
import { useShell } from '../components/LojaShell'
import PuxarParaAtualizar from '../components/PuxarParaAtualizar'
import { linkWhatsApp } from '../config'
import { useTitulo } from '../lib/telas'
import { useSite } from '../lib/site'
import { brl } from '../lib/format'
import { dataPedido, ETAPAS, etapaInfo, mensagemWhatsAppPedido, totalFormatado, usePedidos, type Pedido } from '../lib/pedidos'

export default function PedidoDetalhe() {
  const { numero = '' } = useParams()
  // Número malformado: não existe pedido assim, e nem vale chamar o ERP
  return /^\d+$/.test(numero) ? <Detalhe numero={numero} /> : <NaoEncontrado />
}

function NaoEncontrado() {
  return (
    <div className="container secao centro">
      <h1 className="titulo-pagina">Pedido não encontrado</h1>
      <Link to="/pedidos" className="btn btn-primario">Ver meus pedidos</Link>
    </div>
  )
}

/** "Retirar na gráfica" ou "Entrega" + endereço; valores que não conhecemos não mostram o bloco. */
function recebimentoDoPedido(p: Pedido): { rotulo: string; detalhe?: string } | null {
  const r = (p.recebimento ?? '').toLowerCase()
  if (r.includes('retir')) return { rotulo: 'Retirar na gráfica' }
  if (r.includes('entreg')) return { rotulo: 'Entrega', detalhe: p.endereco?.trim() || 'Endereço a combinar' }
  return null
}

function Detalhe({ numero }: { numero: string }) {
  const { ehMobile } = useShell()
  const { empresa } = useSite()
  const { pedidos, carregando, atualizando, erro, erroAtualizacao, recarregar } = usePedidos()
  useTitulo(`Pedido nº ${numero}`)

  const p = pedidos.find((x) => String(x.numero) === numero)

  // Sessão vencida não tem ramo aqui: o RequerSessao do ContaLayout já troca a página inteira pelo aviso.
  let corpo
  if (!p && (carregando || atualizando) && !erro) {
    corpo = <div className="esqueleto esqueleto-detalhe" aria-busy="true" aria-label="Carregando pedido" />
  } else if (!p && (erro || erroAtualizacao)) {
    corpo = (
      <div className="conta-bloco">
        <p className="dica" role="alert">Não conseguimos carregar o pedido.</p>
        <div>
          <button className="btn btn-secundario" disabled={carregando} onClick={() => void recarregar()}>Tentar de novo</button>
        </div>
      </div>
    )
  } else if (!p) {
    corpo = <NaoEncontrado />
  } else {
    corpo = <Conteudo p={p} whatsapp={!!empresa.whatsapp} aviso={erroAtualizacao} onRecarregar={() => void recarregar()} />
  }

  return (
    <PuxarParaAtualizar onAtualizar={recarregar} ativo={ehMobile}>
      <div className="container secao conta">
        {!ehMobile && (
          <p>
            <Link to="/pedidos" className="voltar-link"><ChevronLeft size={16} aria-hidden="true" /> Voltar para meus pedidos</Link>
          </p>
        )}
        {corpo}
      </div>
    </PuxarParaAtualizar>
  )
}

function Conteudo({ p, whatsapp, aviso, onRecarregar }: { p: Pedido; whatsapp: boolean; aviso: boolean; onRecarregar: () => void }) {
  const info = etapaInfo(p.etapa, p.situacao)
  const receb = recebimentoDoPedido(p)
  const itens = p.itens ?? []

  return (
    <div className="pedido-pagina">
      <h1 className="titulo-pagina titulo-sub">Pedido nº {p.numero}</h1>
      <p className="dica">Feito em {dataPedido(p.data)}</p>
      {aviso && (
        <p className="dica aviso-atualizacao" role="status">
          Não foi possível atualizar. <button className="link-botao" onClick={onRecarregar}>Tentar de novo</button>
        </p>
      )}

      {info.cancelado ? (
        <div className="aviso-cancelado" role="status">
          <strong>Pedido cancelado</strong>
          {p.situacao?.trim() && <span>{p.situacao}</span>}
        </div>
      ) : info.indice === null ? (
        <p className="situacao-desconhecida">Situação: {info.rotulo}</p>
      ) : (
        <ol className="linha-tempo" aria-label="Andamento do pedido">
          {ETAPAS.map((rotulo, i) => (
            <li key={rotulo} className={i < info.indice! ? 'feita' : i === info.indice ? 'atual' : 'pendente'} aria-current={i === info.indice ? 'step' : undefined}>
              <span className="linha-tempo-rotulo">{rotulo}</span>
              {i === info.indice && info.nota && <small className="linha-tempo-nota">{info.nota}</small>}
            </li>
          ))}
        </ol>
      )}

      <section className="conta-bloco vidro pedido-bloco">
        <h2>Itens</h2>
        {itens.length === 0 ? (
          <p className="dica">Sem itens</p>
        ) : (
          <ul className="resumo-itens">
            {itens.map((i, k) => (
              <li key={k}>
                <span className="item-desc">{`${i.descricao} × ${i.quantidade}`}</span>
                {typeof i.preco_unitario === 'number' && <small className="item-unitario">{brl(i.preco_unitario)}</small>}
                <strong>{totalFormatado(i.total)}</strong>
              </li>
            ))}
          </ul>
        )}
        {receb && (
          <p className="recebimento">
            <strong>{receb.rotulo}</strong>
            {receb.detalhe && <span className="dica">{receb.detalhe}</span>}
          </p>
        )}
        <div className="linha-resumo">
          <span>Total</span>
          <strong>{totalFormatado(p.total)}</strong>
        </div>
      </section>

      {whatsapp && (
        <div className="pedido-acoes">
          <a className="btn btn-secundario" href={linkWhatsApp(mensagemWhatsAppPedido(p.numero))} target="_blank" rel="noreferrer">
            Falar no WhatsApp sobre este pedido
          </a>
        </div>
      )}
    </div>
  )
}
