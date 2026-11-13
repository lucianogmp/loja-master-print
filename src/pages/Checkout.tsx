import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from '../components/Link'
import { useShell } from '../components/LojaShell'
import { linkWhatsApp } from '../config'
import { brl } from '../lib/format'
import { useCart } from '../lib/cart'
import { useAuth } from '../lib/auth'
import { useCatalogo } from '../lib/catalogo'
import { useSite } from '../lib/site'
import { ERP_URL } from '../lib/erp'
import { useAjustes } from '../lib/ajustes'
import { consultarFrete, envioPronto, type OpcaoFrete } from '../lib/envio'
import { limparCachePedidos } from '../lib/pedidos'
import { calcularTotal } from '../lib/preco'
import { supabase } from '../lib/supabase'
import { ENDERECO_VAZIO, paraLinha, so, textoEndereco, useEnderecos, validarEndereco, type EnderecoCampos as Campos } from '../lib/enderecos'
import EnderecoCampos from '../components/EnderecoCampos'

type Entrega = 'retirada' | 'entrega'

export default function Checkout() {
  const { itens, subtotal, temSobConsulta, limpar } = useCart()
  const { produtoPorSlug } = useCatalogo()
  const { empresa } = useSite()
  const { session, carregando } = useAuth()
  const [entregaEscolhida, setEntrega] = useState<Entrega>('retirada')
  const { lista: enderecos, indisponivel: semEnderecos } = useEnderecos()
  const [escolhido, setEscolhido] = useState<string>('') // id de um endereço salvo, ou 'novo'
  const [novo, setNovo] = useState<Campos>(ENDERECO_VAZIO)
  const [salvarNovo, setSalvarNovo] = useState(true)
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState<{ numero: number; total: number; semLink?: boolean } | null>(null)
  const { ajustes } = useAjustes()
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [freteCodigo, setFreteCodigo] = useState('')
  const [carregandoFrete, setCarregandoFrete] = useState(false)
  const [erroFrete, setErroFrete] = useState('')
  const { ehMobile } = useShell()
  const Titulo = ehMobile ? 'h2' : 'h1' // no celular o h1 é o da barra do topo
  const ref = useRef(crypto.randomUUID()) // evita pedido duplicado se clicar duas vezes

  // "Acorda" a função de pedidos ao abrir o checkout: o primeiro envio não paga a partida a frio
  useEffect(() => {
    fetch(`${ERP_URL}/functions/v1/loja-criar-pedido`, { method: 'POST', body: '{}' }).catch(() => {})
  }, [])

  // Se algum produto do carrinho é só para retirada, a entrega fica indisponível.
  const soRetirada = itens.some((i) => produtoPorSlug(i.slug)?.entregaModo === 'so_retirada')
  // Com o frete online ligado, só produto com peso e medidas do pacote cadastrados pode ser enviado
  const freteOnline = ajustes.frete.ligado
  const semEnvio = freteOnline
    ? [...new Set(itens.map((i) => produtoPorSlug(i.slug)).filter((p) => p && !envioPronto(p)).map((p) => p!.nome))]
    : []
  const entregaBloqueada = soRetirada || semEnvio.length > 0
  const entrega: Entrega = entregaBloqueada ? 'retirada' : entregaEscolhida
  const pagarOnline = ajustes.pagamento.ligado

  // CEP do endereço de entrega escolhido (salvo ou digitado)
  const idPadrao = escolhido || enderecos.find((x) => x.padrao)?.id || enderecos[0]?.id || 'novo'
  const cepEntrega = so((enderecos.find((x) => x.id === idPadrao) ?? novo).cep)
  const chaveItens = itens.map((i) => `${i.slug}:${i.quantidade}`).join('|')

  // Calcula o frete quando o CEP está completo
  useEffect(() => {
    if (!(entrega === 'entrega' && freteOnline) || cepEntrega.length !== 8) {
      setOpcoesFrete([])
      setFreteCodigo('')
      setErroFrete('')
      return
    }
    let vivo = true
    setCarregandoFrete(true)
    setErroFrete('')
    const lista = itens
      .map((i) => {
        const p = produtoPorSlug(i.slug)
        return p ? { produto_id: p.id, quantidade: i.quantidade } : null
      })
      .filter((x): x is { produto_id: string; quantidade: number } => !!x)
    consultarFrete(cepEntrega, lista).then((r) => {
      if (!vivo) return
      setCarregandoFrete(false)
      if (r.ok) {
        setOpcoesFrete(r.opcoes)
        setFreteCodigo(r.opcoes[0]?.codigo ?? '')
      } else {
        setOpcoesFrete([])
        setFreteCodigo('')
        setErroFrete(r.erro)
      }
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrega, freteOnline, cepEntrega, chaveItens])
  const freteEscolhido = opcoesFrete.find((o) => o.codigo === freteCodigo)
  const valorFrete = freteEscolhido?.valor ?? 0

  if (feito) {
    const msg =
      `Olá! Acabei de fazer o pedido nº ${feito.numero} pelo site (${brl(feito.total)}). ` +
      `Pode confirmar e combinar o pagamento e a arte?`
    return (
      <div className="container secao centro">
        <Titulo className="titulo-pagina">Pedido nº {feito.numero} recebido!</Titulo>
        <p className="subtitulo">
          {freteOnline && entrega === 'entrega'
            ? `Total com frete: ${brl(feito.total)}. `
            : `Total dos produtos: ${brl(feito.total)}. `}
          {feito.semLink
            ? 'Não conseguimos abrir o pagamento online agora: combine o pagamento com a gente pelo WhatsApp.'
            : `Falta combinar o pagamento${entrega === 'entrega' && !freteOnline ? ', o frete' : ''} e a arte com a gente.`}
        </p>
        {empresa.whatsapp && (
          <a className="btn btn-primario" href={linkWhatsApp(msg)} target="_blank" rel="noreferrer">
            Continuar no WhatsApp
          </a>
        )}
        <Link to="/pedidos" className="btn btn-secundario">Ver meus pedidos</Link>
        <p className="dica">
          <Link to="/produtos">Voltar aos produtos</Link>
        </p>
      </div>
    )
  }

  if (itens.length === 0) {
    return (
      <div className="container secao centro">
        <Titulo className="titulo-pagina">Nada para finalizar</Titulo>
        <p className="subtitulo">Seu carrinho está vazio. Escolha os produtos e volte aqui para enviar o pedido.</p>
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
        <Titulo className="titulo-pagina">Entre para finalizar</Titulo>
        <p className="subtitulo">Seu carrinho fica guardado. Entre ou crie uma conta para enviar o pedido.</p>
        <div className="acoes-produto">
          <Link to="/entrar?voltar=/checkout" className="btn btn-primario">Entrar</Link>
          <Link to="/cadastro?voltar=/checkout" className="btn btn-secundario">Criar conta</Link>
        </div>
      </div>
    )
  }

  // Sem escolha explícita: usa o endereço padrão (ou o primeiro); sem nenhum salvo, o formulário novo
  const idEfetivo = idPadrao
  const salvoEscolhido = enderecos.find((x) => x.id === idEfetivo)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    let endereco: Campos | null = null
    if (entrega === 'entrega') {
      endereco = salvoEscolhido ?? novo
      const meta = (session!.user.user_metadata as { nome?: string; telefone?: string }) ?? {}
      if (!endereco.destinatario.trim()) endereco = { ...endereco, destinatario: meta.nome ?? '' }
      const problema = validarEndereco(endereco)
      if (problema) return setErro(problema)
    }
    if (entrega === 'entrega' && freteOnline && !freteEscolhido) {
      return setErro(carregandoFrete ? 'Aguarde o cálculo do frete.' : erroFrete || 'Escolha a forma de envio.')
    }
    setEnviando(true)
    try {
      if (endereco && !salvoEscolhido && salvarNovo && !semEnderecos && enderecos.length < 5) {
        // guarda o endereço na conta para os próximos pedidos (se falhar, o pedido segue mesmo assim)
        await supabase.from('enderecos').insert({ ...paraLinha(endereco, session!.user.id), padrao: enderecos.length === 0 })
      }
      const corpo = {
        ref: ref.current,
        entrega,
        endereco: endereco && { ...endereco, cep: so(endereco.cep) },
        frete_codigo: entrega === 'entrega' && freteOnline ? freteEscolhido?.codigo : undefined,
        pagar: pagarOnline,
        observacao,
        itens: itens
          .map((i) => {
            const p = produtoPorSlug(i.slug)
            return p ? { produto_id: p.id, derivado_id: p.derivadoId, quantidade: i.quantidade, arte: i.arte, observacao: i.observacao } : null
          })
          .filter(Boolean),
      }
      const r = await fetch(`${ERP_URL}/functions/v1/loja-criar-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-comprador-token': session!.access_token },
        body: JSON.stringify(corpo),
      })
      const dados = await r.json().catch(() => ({}))
      if (r.status === 401) {
        setErro('Sua sessão expirou. Entre novamente.')
        return
      }
      if (!r.ok) {
        setErro(dados.erro ?? 'Não foi possível enviar o pedido. Tente pelo WhatsApp.')
        return
      }
      limparCachePedidos(session!.user.id)
      limpar()
      ref.current = crypto.randomUUID()
      // Pagamento online: leva direto para a página segura de pagamento
      if (typeof dados.pagamento_url === 'string' && dados.pagamento_url.startsWith('https://')) {
        window.location.assign(dados.pagamento_url)
        return
      }
      setFeito({ numero: dados.numero, total: dados.total, semLink: !!dados.pagamento_erro })
    } catch {
      setErro('Sem conexão. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  const nome = (session.user.user_metadata as { nome?: string })?.nome

  return (
    <div className="container secao">
      <h1 className="titulo-pagina titulo-sub">Finalizar pedido</h1>
      <div className="carrinho-grade">
        <form className="form-checkout" onSubmit={enviar}>
          <h2>Seus dados</h2>
          <p className="dica">
            Pedido em nome de <strong>{nome ?? session.user.email}</strong> ({session.user.email}).{' '}
            <Link to="/conta">Alterar dados</Link>
          </p>

          <fieldset className="campo opcoes-arte">
            <legend>Como quer receber?</legend>
            {soRetirada && (
              <span className="dica">Há produto no carrinho que só pode ser retirado na gráfica.</span>
            )}
            {!soRetirada && semEnvio.length > 0 && (
              <span className="dica">Envio indisponível para: {semEnvio.join(', ')}. Para receber em casa, tire esse item do carrinho ou combine o envio pelo WhatsApp.</span>
            )}
            <label className="radio">
              <input type="radio" name="entrega" checked={entrega === 'retirada'} onChange={() => setEntrega('retirada')} />
              Retirar na gráfica
            </label>
            <label className="radio">
              <input type="radio" name="entrega" checked={entrega === 'entrega'} disabled={entregaBloqueada} onChange={() => setEntrega('entrega')} />
              {freteOnline ? 'Receber em casa (Correios)' : 'Receber em casa (frete combinado)'}
            </label>
          </fieldset>

          {entrega === 'entrega' && (
            <fieldset className="campo opcoes-arte">
              <legend>Endereço de entrega</legend>
              {enderecos.map((x) => (
                <label key={x.id} className="radio">
                  <input type="radio" name="endereco" checked={idEfetivo === x.id} onChange={() => setEscolhido(x.id)} />
                  <span>
                    <strong>{x.destinatario}</strong>
                    {x.padrao && <small className="selo-padrao"> · padrão</small>}
                    <br />
                    <small>{textoEndereco(x)}</small>
                  </span>
                </label>
              ))}
              {enderecos.length > 0 && (
                <label className="radio">
                  <input type="radio" name="endereco" checked={idEfetivo === 'novo'} onChange={() => setEscolhido('novo')} />
                  Usar outro endereço
                </label>
              )}
              {idEfetivo === 'novo' && (
                <>
                  <EnderecoCampos valor={novo} onChange={setNovo} prefixo="ck" />
                  {!semEnderecos && enderecos.length < 5 && (
                    <label className="radio">
                      <input type="checkbox" checked={salvarNovo} onChange={(e) => setSalvarNovo(e.target.checked)} /> Salvar este endereço na minha conta
                    </label>
                  )}
                </>
              )}
              {!freteOnline && <span className="dica">O valor e o prazo do frete são confirmados pela gráfica.</span>}
            </fieldset>
          )}

          {entrega === 'entrega' && freteOnline && (
            <fieldset className="campo opcoes-arte">
              <legend>Forma de envio</legend>
              {cepEntrega.length !== 8 && <span className="dica">Informe o CEP do endereço para calcular o frete.</span>}
              {carregandoFrete && <span className="dica">Calculando o frete nos Correios...</span>}
              {erroFrete && <span className="dica" role="alert">{erroFrete}</span>}
              {opcoesFrete.map((o) => (
                <label key={o.codigo} className="radio">
                  <input type="radio" name="frete" checked={freteCodigo === o.codigo} onChange={() => setFreteCodigo(o.codigo)} />
                  <span>
                    <strong>{o.nome}</strong> — {o.valor === 0 ? 'Frete grátis' : brl(o.valor)}
                    {o.prazo ? <small> · {o.prazo} dia(s) úteis após a postagem</small> : null}
                  </span>
                </label>
              ))}
              {opcoesFrete.length > 0 && <span className="dica">O prazo de envio conta depois que o pedido fica pronto.</span>}
            </fieldset>
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
            {enviando ? 'Enviando...' : pagarOnline ? 'Ir para o pagamento' : 'Enviar pedido'}
          </button>
          <p className="aviso-exemplo">
            {pagarOnline
              ? 'Você paga em uma página segura da InfinitePay (cartão ou Pix). A gráfica confirma a arte depois.'
              : 'O pagamento é combinado com a gráfica depois do envio. O valor final é confirmado por ela.'}
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
            <span>
              {entrega === 'retirada'
                ? 'Grátis (retirada)'
                : !freteOnline
                  ? 'A combinar'
                  : freteEscolhido
                    ? freteEscolhido.valor === 0 ? 'Grátis' : brl(freteEscolhido.valor)
                    : 'Informe o CEP'}
            </span>
          </div>
          {freteOnline && entrega === 'entrega' && freteEscolhido && (
            <div className="linha-resumo">
              <span>Total</span>
              <strong>{brl(subtotal + valorFrete)}</strong>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
