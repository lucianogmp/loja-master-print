import { useState } from 'react'
import { Link } from 'react-router-dom'
import { brl } from '../lib/format'
import { linkWhatsApp } from '../config'
import { usePedidos, type Pedido } from '../lib/pedidos'

const ETAPAS = ['Recebido', 'Em produção', 'Pronto', 'Entregue']

export default function ContaPedidos() {
  const { pedidos, carregando, erro, recarregar } = usePedidos()
  const [aberto, setAberto] = useState<number | null>(null)

  if (carregando) return <p className="dica">Carregando seus pedidos...</p>
  if (erro)
    return (
      <div className="conta-bloco">
        <p className="dica" role="alert">{erro}</p>
        <div>
          <button className="btn btn-secundario" onClick={recarregar}>Tentar de novo</button>
        </div>
      </div>
    )
  if (pedidos.length === 0)
    return (
      <div className="conta-bloco">
        <h2>Meus pedidos</h2>
        <p className="dica">Você ainda não fez nenhum pedido pelo site.</p>
        <div>
          <Link to="/produtos" className="btn btn-primario">Ver produtos</Link>
        </div>
      </div>
    )

  return (
    <div className="conta-bloco">
      <h2>Meus pedidos</h2>
      <ul className="lista-admin">
        {pedidos.map((p) => (
          <li key={p.numero} className="admin-item">
            <button className="pedido-linha" onClick={() => setAberto(aberto === p.numero ? null : p.numero)} aria-expanded={aberto === p.numero}>
              <strong>Pedido nº {p.numero}</strong>
              <span className="dica">{new Date(p.data).toLocaleDateString('pt-BR')}</span>
              <span className={`pedido-situacao etapa-${p.etapa}`}>{p.situacao}</span>
              <strong className="pedido-total">{brl(p.total)}</strong>
            </button>
            {aberto === p.numero && <Detalhe p={p} />}
          </li>
        ))}
      </ul>
      <p className="dica">O pagamento e o frete são combinados com a gráfica pelo WhatsApp.</p>
    </div>
  )
}

function Detalhe({ p }: { p: Pedido }) {
  const msg = `Olá! Quero falar sobre o meu pedido nº ${p.numero} feito pelo site.`
  return (
    <div className="pedido-detalhe">
      {p.etapa > 0 && (
        <ol className="pedido-etapas" aria-label="Andamento do pedido">
          {ETAPAS.map((e, i) => (
            <li key={e} className={p.etapa >= i + 1 ? 'feita' : ''}>{e}</li>
          ))}
        </ol>
      )}
      <ul className="resumo-itens">
        {p.itens.map((i, k) => (
          <li key={k}>
            <span>{i.descricao} <small>× {i.quantidade}</small></span>
            <strong>{brl(i.total)}</strong>
          </li>
        ))}
      </ul>
      {p.recebimento && <p className="dica">Recebimento: {p.recebimento}</p>}
      {p.endereco && <p className="dica">Endereço: {p.endereco}</p>}
      <div>
        <a className="btn btn-secundario" href={linkWhatsApp(msg)} target="_blank" rel="noreferrer">Falar sobre este pedido</a>
      </div>
    </div>
  )
}
