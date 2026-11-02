import { RefreshCw } from 'lucide-react'
import { Link } from '../components/Link'
import { useShell } from '../components/LojaShell'
import PuxarParaAtualizar from '../components/PuxarParaAtualizar'
import { classeEtapa, dataPedido, etapaInfo, resumoItens, totalFormatado, usePedidos } from '../lib/pedidos'

export default function Pedidos() {
  const { ehMobile } = useShell()
  const { pedidos, carregando, atualizando, erro, erroAtualizacao, recarregar } = usePedidos()

  let corpo
  if (erro && pedidos.length === 0) {
    corpo = (
      <div className="conta-bloco">
        <p className="dica" role="alert">Não conseguimos carregar seus pedidos.</p>
        <div>
          <button className="btn btn-secundario" disabled={carregando} onClick={() => void recarregar()}>Tentar de novo</button>
        </div>
      </div>
    )
  } else if (carregando) {
    corpo = (
      <div className="lista-pedidos" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="cartao-pedido vidro esqueleto-cartao esqueleto" aria-hidden="true" />
        ))}
      </div>
    )
  } else if (pedidos.length === 0) {
    corpo = (
      <div className="conta-bloco">
        <p className="dica">Você ainda não fez pedidos.</p>
        <div>
          <Link to="/produtos" className="btn btn-primario">Ver produtos</Link>
        </div>
      </div>
    )
  } else {
    corpo = (
      <div className="lista-pedidos">
        {pedidos.map((p, i) => {
          const info = etapaInfo(p.etapa, p.situacao)
          return (
            <Link key={`${p.numero}-${i}`} to={`/pedidos/${p.numero}`} className="cartao-pedido vidro">
              <span className="cartao-pedido-topo">
                <strong>Pedido nº {p.numero}</strong>
                <span className={`chip ${classeEtapa(p)}`}>{info.rotulo}</span>
              </span>
              <span className="dica">{dataPedido(p.data)}</span>
              <span className="truncar">{resumoItens(p)}</span>
              <strong className="cartao-pedido-total">{totalFormatado(p.total)}</strong>
            </Link>
          )
        })}
      </div>
    )
  }

  const conteudo = (
    <div className="container secao conta">
      <div className="secao-topo">
        <h1 className="titulo-pagina">Meus pedidos</h1>
        {!ehMobile && (
          <button className="btn btn-secundario" disabled={atualizando || carregando} onClick={() => void recarregar()}>
            <RefreshCw size={16} aria-hidden="true" /> Atualizar
          </button>
        )}
      </div>
      {erroAtualizacao && (
        <p className="dica aviso-atualizacao" role="status">
          Não foi possível atualizar. <button className="link-botao" onClick={() => void recarregar()}>Tentar de novo</button>
        </p>
      )}
      {corpo}
      {pedidos.length > 0 && <p className="dica">O pagamento e o frete são combinados com a gráfica pelo WhatsApp.</p>}
    </div>
  )

  return (
    <PuxarParaAtualizar onAtualizar={recarregar} ativo={ehMobile}>
      {conteudo}
    </PuxarParaAtualizar>
  )
}
