import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { produtoPorSlug } from '../data/produtos'
import { linkWhatsApp } from '../config'
import { brl } from '../lib/format'
import { useCart } from '../lib/cart'
import { calcularTotal, rotuloArte } from '../lib/preco'

type Entrega = 'retirada' | 'entrega'

export default function Checkout() {
  const { itens, subtotal, temSobConsulta } = useCart()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [entrega, setEntrega] = useState<Entrega>('retirada')
  const [cep, setCep] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviado, setEnviado] = useState(false)

  if (itens.length === 0) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Nada para finalizar</h1>
        <Link to="/produtos" className="btn btn-primario">
          Ver produtos
        </Link>
      </div>
    )
  }

  function montarMensagem() {
    const linhas = itens.map((item, i) => {
      const produto = produtoPorSlug(item.slug)
      if (!produto) return ''
      const variacao = produto.variacoes.find((v) => v.id === item.variacaoId)
      const total = calcularTotal(produto, item)
      return (
        `${i + 1}) ${produto.nome} — ${variacao?.label ?? ''}` +
        (item.larguraCm && item.alturaCm ? `, ${item.larguraCm} x ${item.alturaCm} cm` : '') +
        `, qtd. ${item.quantidade}` +
        ` — ${total === null ? 'sob consulta' : brl(total)}` +
        ` | Arte: ${rotuloArte[item.arte]}` +
        (item.observacao ? ` | Obs.: ${item.observacao}` : '')
      )
    })
    return [
      'Olá! Quero fazer este pedido pelo site:',
      '',
      ...linhas,
      '',
      `Subtotal: ${brl(subtotal)}${temSobConsulta ? ' (há itens sob consulta)' : ''}`,
      `Recebimento: ${entrega === 'retirada' ? 'retirada na gráfica' : `entrega${cep ? ` (CEP ${cep})` : ''}`}`,
      `Nome: ${nome}`,
      `Contato: ${telefone}`,
      observacao ? `Observações: ${observacao}` : '',
    ]
      .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
      .join('\n')
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviado(true)
    window.open(linkWhatsApp(montarMensagem()), '_blank', 'noopener')
  }

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">Finalizar pedido</h1>
      <div className="carrinho-grade">
        <form className="form-checkout" onSubmit={enviar}>
          <h2>Seus dados</h2>
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          </div>
          <div className="campo">
            <label htmlFor="tel">WhatsApp</label>
            <input
              id="tel"
              required
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <fieldset className="campo opcoes-arte">
            <legend>Como quer receber?</legend>
            <label className="radio">
              <input type="radio" name="entrega" checked={entrega === 'retirada'} onChange={() => setEntrega('retirada')} />
              Retirar na gráfica
            </label>
            <label className="radio">
              <input type="radio" name="entrega" checked={entrega === 'entrega'} onChange={() => setEntrega('entrega')} />
              Receber em casa (frete combinado)
            </label>
          </fieldset>

          {entrega === 'entrega' && (
            <div className="campo">
              <label htmlFor="cep">CEP</label>
              <input id="cep" inputMode="numeric" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
              <span className="dica">O valor e o prazo do frete são confirmados pela gráfica.</span>
            </div>
          )}

          <div className="campo">
            <label htmlFor="obs">Observações (opcional)</label>
            <textarea id="obs" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primario btn-bloco">
            Enviar pedido pelo WhatsApp
          </button>
          {enviado && (
            <p className="dica">
              Abrimos o WhatsApp com o resumo do pedido. Se não abriu, permita pop-ups neste site e tente de novo.
            </p>
          )}
          <p className="aviso-exemplo">
            Nesta versão de demonstração o pagamento online ainda não está ativo e o pedido não é salvo no sistema.
          </p>
        </form>

        <aside className="resumo">
          <h2>Resumo</h2>
          <ul className="resumo-itens">
            {itens.map((item) => {
              const produto = produtoPorSlug(item.slug)
              if (!produto) return null
              const total = calcularTotal(produto, item)
              return (
                <li key={item.id}>
                  <span>
                    {produto.nome} <small>× {item.quantidade}</small>
                  </span>
                  <strong>{total === null ? 'Sob consulta' : brl(total)}</strong>
                </li>
              )
            })}
          </ul>
          <div className="linha-resumo">
            <span>Subtotal</span>
            <strong>{brl(subtotal)}</strong>
          </div>
          <div className="linha-resumo">
            <span>Frete</span>
            <span>{entrega === 'retirada' ? 'Grátis (retirada)' : 'A combinar'}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
