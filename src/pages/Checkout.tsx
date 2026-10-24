import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { linkWhatsApp } from '../config'
import { brl } from '../lib/format'
import { useCart } from '../lib/cart'
import { useAuth } from '../lib/auth'
import { useCatalogo } from '../lib/catalogo'
import { ERP_URL } from '../lib/erp'
import { calcularTotal } from '../lib/preco'

type Entrega = 'retirada' | 'entrega'

export default function Checkout() {
  const { itens, subtotal, temSobConsulta, limpar } = useCart()
  const { produtoPorSlug } = useCatalogo()
  const { session, carregando } = useAuth()
  const [entrega, setEntrega] = useState<Entrega>('retirada')
  const [cep, setCep] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState<{ numero: number; total: number } | null>(null)
  const ref = useRef(crypto.randomUUID()) // evita pedido duplicado se clicar duas vezes

  if (feito) {
    const msg =
      `Olá! Acabei de fazer o pedido nº ${feito.numero} pelo site (${brl(feito.total)}). ` +
      `Pode confirmar e combinar o pagamento e a arte?`
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Pedido nº {feito.numero} recebido!</h1>
        <p className="subtitulo">
          Total dos produtos: {brl(feito.total)}. Falta combinar o pagamento{entrega === 'entrega' ? ', o frete' : ''} e a arte com a gente.
        </p>
        <a className="btn btn-primario" href={linkWhatsApp(msg)} target="_blank" rel="noreferrer">
          Continuar no WhatsApp
        </a>
        <p className="dica">
          <Link to="/produtos">Voltar aos produtos</Link>
        </p>
      </div>
    )
  }

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

  if (carregando) return <div className="container secao">Carregando...</div>

  if (!session) {
    return (
      <div className="container secao centro">
        <h1 className="titulo-pagina">Entre para finalizar</h1>
        <p className="subtitulo">Seu carrinho fica guardado. Entre ou crie uma conta para enviar o pedido.</p>
        <div className="acoes-produto">
          <Link to="/entrar" className="btn btn-primario">Entrar</Link>
          <Link to="/cadastro" className="btn btn-secundario">Criar conta</Link>
        </div>
      </div>
    )
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const corpo = {
        ref: ref.current,
        entrega,
        cep,
        observacao,
        itens: itens
          .map((i) => {
            const p = produtoPorSlug(i.slug)
            return p ? { produto_id: p.id, quantidade: i.quantidade, arte: i.arte, observacao: i.observacao } : null
          })
          .filter(Boolean),
      }
      const r = await fetch(`${ERP_URL}/functions/v1/loja-criar-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-comprador-token': session!.access_token },
        body: JSON.stringify(corpo),
      })
      const dados = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErro(dados.erro ?? 'Não foi possível enviar o pedido. Tente pelo WhatsApp.')
        return
      }
      setFeito({ numero: dados.numero, total: dados.total })
      limpar()
      ref.current = crypto.randomUUID()
    } catch {
      setErro('Sem conexão. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  const nome = (session.user.user_metadata as { nome?: string })?.nome

  return (
    <div className="container secao">
      <h1 className="titulo-pagina">Finalizar pedido</h1>
      <div className="carrinho-grade">
        <form className="form-checkout" onSubmit={enviar}>
          <h2>Seus dados</h2>
          <p className="dica">
            Pedido em nome de <strong>{nome ?? session.user.email}</strong> ({session.user.email}).{' '}
            <Link to="/conta">Alterar dados</Link>
          </p>

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
            <textarea id="obs" rows={3} maxLength={500} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>

          {temSobConsulta && (
            <p className="dica">Itens sob consulta não entram no pedido. Peça o orçamento deles pelo WhatsApp.</p>
          )}
          {erro && <p className="dica" role="alert">{erro}</p>}
          <button type="submit" className="btn btn-primario btn-bloco" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar pedido'}
          </button>
          <p className="aviso-exemplo">
            O pagamento é combinado com a gráfica depois do envio. O valor final é confirmado por ela.
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
