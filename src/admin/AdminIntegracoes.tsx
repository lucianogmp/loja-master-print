import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { erp, ERP_URL } from '../lib/erp'
import { AJUSTES_PADRAO, normalizarAjustes, type Ajustes, type ServicoEnvio } from '../lib/ajustes'

type Status = {
  infinitepay: { handle: { valor: string }; apiKey: { preenchido: boolean } }
  correios: {
    usuario: { preenchido: boolean }
    codigoAcesso: { preenchido: boolean }
    cartaoPostagem: { valor: string }
    contrato: { valor: string }
    dr: { valor: string }
  }
}

async function chamar(corpo: Record<string, unknown>) {
  const { data } = await erp.auth.getSession()
  const r = await fetch(`${ERP_URL}/functions/v1/loja-integracoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify(corpo),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.erro ?? 'Falhou. Tente de novo.')
  return j
}

const paraNumero = (s: string) => {
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const paraTexto = (n: number) => (n ? String(n).replace('.', ',') : '')

export default function AdminIntegracoes({ parte }: { parte: 'pagamento' | 'frete' }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [erroCarga, setErroCarga] = useState('')
  const [aj, setAj] = useState<Ajustes>(AJUSTES_PADRAO)
  const [cepOrigem, setCepOrigem] = useState('')
  const [resumo, setResumo] = useState<{ prontos: number; sem: number; retirada: number } | null>(null)

  // campos de texto
  const [handle, setHandle] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [usuario, setUsuario] = useState('')
  const [codigoAcesso, setCodigoAcesso] = useState('')
  const [cartao, setCartao] = useState('')
  const [contrato, setContrato] = useState('')
  const [dr, setDr] = useState('')
  const [embalagem, setEmbalagem] = useState('')
  const [gratis, setGratis] = useState('')
  const [dias, setDias] = useState('')
  const [servicos, setServicos] = useState<ServicoEnvio[]>(AJUSTES_PADRAO.frete.servicos)

  const [msgPag, setMsgPag] = useState('')
  const [msgFrete, setMsgFrete] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const [s, ajR, lpR] = await Promise.all([
        chamar({ acao: 'status' }) as Promise<Status>,
        erp.from('loja_ajustes').select('chave,valor'),
        erp.from('loja_produtos').select('entrega_modo,peso_kg,comprimento_cm,largura_cm,altura_cm'),
      ])
      setStatus(s)
      setHandle(s.infinitepay.handle.valor)
      setCartao(s.correios.cartaoPostagem.valor)
      setContrato(s.correios.contrato.valor)
      setDr(s.correios.dr.valor)
      const mapa: Record<string, any> = Object.fromEntries((ajR.data ?? []).map((a: any) => [a.chave, a.valor]))
      const n = normalizarAjustes(mapa)
      setAj(n)
      setCepOrigem(String(mapa.frete?.cepOrigem ?? ''))
      setEmbalagem(paraTexto(n.frete.embalagem))
      setGratis(paraTexto(n.frete.gratisAcima))
      setDias(n.frete.diasExtras ? String(n.frete.diasExtras) : '')
      setServicos(n.frete.servicos)
      const lps = (lpR.data ?? []) as any[]
      const retirada = lps.filter((l) => l.entrega_modo === 'so_retirada').length
      const prontos = lps.filter((l) => l.entrega_modo !== 'so_retirada' && l.peso_kg > 0 && l.comprimento_cm > 0 && l.largura_cm > 0 && l.altura_cm > 0).length
      setResumo({ prontos, retirada, sem: lps.length - retirada - prontos })
    } catch (e) {
      setErroCarga((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function salvarAjuste(chave: 'pagamento' | 'frete', valor: Record<string, unknown>) {
    const { error } = await erp.from('loja_ajustes').upsert({ chave, valor, atualizado_em: new Date().toISOString() })
    if (error) throw new Error('Não foi possível salvar.')
  }

  async function salvarPagamento(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setMsgPag('')
    try {
      const tag = handle.trim().replace(/^\$/, '')
      if (aj.pagamento.ligado && !tag) throw new Error('Para ligar o pagamento, preencha o seu InfiniteTag.')
      await chamar({ acao: 'salvar', integracao: 'infinitepay', campos: { handle: tag, apiKey } })
      await salvarAjuste('pagamento', { ligado: aj.pagamento.ligado })
      setApiKey('')
      await carregar()
      setMsgPag(aj.pagamento.ligado ? 'Salvo. O pagamento online está LIGADO no site.' : 'Salvo. O pagamento online está desligado (o pedido segue pelo WhatsApp).')
    } catch (er) {
      setMsgPag((er as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  async function salvarFrete(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setMsgFrete('')
    try {
      const cep = cepOrigem.replace(/\D/g, '')
      if (aj.frete.ligado) {
        const temUsuario = usuario.trim() || status?.correios.usuario.preenchido
        const temCodigo = codigoAcesso.trim() || status?.correios.codigoAcesso.preenchido
        if (!temUsuario || !temCodigo || !cartao.trim()) throw new Error('Para ligar o frete, preencha usuário, código de acesso e cartão de postagem.')
        if (cep.length !== 8) throw new Error('Para ligar o frete, informe o CEP de origem (8 números).')
        if (!servicos.some((s) => s.ativo)) throw new Error('Deixe pelo menos um serviço de envio ativo.')
      }
      await chamar({ acao: 'salvar', integracao: 'correios', campos: { usuario, codigoAcesso, cartaoPostagem: cartao, contrato, dr } })
      await salvarAjuste('frete', {
        ligado: aj.frete.ligado,
        cepOrigem: cep,
        embalagem: paraNumero(embalagem),
        gratisAcima: paraNumero(gratis),
        diasExtras: Math.round(paraNumero(dias)),
        servicos: servicos.filter((s) => /^\d{5}$/.test(s.codigo)),
      })
      setUsuario('')
      setCodigoAcesso('')
      await carregar()
      setMsgFrete(aj.frete.ligado ? 'Salvo. O cálculo de frete está LIGADO no site.' : 'Salvo. O frete online está desligado (frete a combinar).')
    } catch (er) {
      setMsgFrete((er as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  async function testar(integracao: 'infinitepay' | 'correios', definir: (m: string) => void) {
    setOcupado(true)
    definir('Testando...')
    try {
      const r = await chamar({ acao: 'testar', integracao })
      definir(`${r.ok ? '✅' : '⚠️'} ${r.mensagem}`)
    } catch (er) {
      definir((er as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  const mudaServico = (i: number, parte: Partial<ServicoEnvio>) => setServicos((l) => l.map((s, k) => (k === i ? { ...s, ...parte } : s)))

  if (erroCarga) return <p className="dica" role="alert">{erroCarga}</p>
  if (!status) return <p className="dica">Carregando...</p>

  return (
    <div className="admin-form admin-integ">
      <p className="dica">
        As chaves ficam guardadas só no servidor: depois de salvas elas não aparecem mais nesta tela nem no site. Tudo começa
        desligado; enquanto estiver desligado, o pedido segue pelo WhatsApp{parte === 'frete' ? ' e o frete é combinado' : ''}.
      </p>

      {parte === 'pagamento' && (
      <form className="conta-bloco vidro admin-bloco-int" onSubmit={salvarPagamento}>
        <h2 className="admin-sub">Pagamento online — InfinitePay (cartão, Pix e boleto)</h2>
        <label className="radio">
          <input type="checkbox" checked={aj.pagamento.ligado} onChange={(e) => setAj({ ...aj, pagamento: { ligado: e.target.checked } })} />
          Ligar pagamento online no checkout (cartão e Pix)
        </label>
        <div className="admin-linha">
          <div className="campo campo-medio">
            <label htmlFor="ip-handle">InfiniteTag (sem o $)</label>
            <input id="ip-handle" value={handle} onChange={(e) => setHandle(e.target.value)} autoComplete="off" />
          </div>
          <div className="campo">
            <label htmlFor="ip-key">Chave de API (opcional)</label>
            <input id="ip-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="new-password"
              placeholder={status.infinitepay.apiKey.preenchido ? '•••••• já preenchida — deixe vazio para manter' : 'inchk_...'} />
          </div>
        </div>
        <span className="dica">A chave de API é opcional: com ela o link de pagamento só vale uma vez. O aviso de pagamento chega sozinho no pedido do ERP.</span>
        {msgPag && <p className="dica" role="status">{msgPag}</p>}
        <div className="admin-acoes">
          <button className="btn btn-primario" disabled={ocupado}>Salvar</button>
          <button type="button" className="btn btn-secundario" disabled={ocupado} onClick={() => testar('infinitepay', setMsgPag)}>Testar conexão</button>
        </div>
      </form>
      )}

      {parte === 'frete' && (
      <form className="conta-bloco vidro admin-bloco-int" onSubmit={salvarFrete}>
        <h2 className="admin-sub">Frete — Correios (contrato)</h2>
        <label className="radio">
          <input type="checkbox" checked={aj.frete.ligado} onChange={(e) => setAj({ ...aj, frete: { ...aj.frete, ligado: e.target.checked } })} />
          Ligar cálculo de frete no checkout
        </label>
        {resumo && (
          <p className="dica">
            Produtos com envio pronto: <strong>{resumo.prontos}</strong> · sem peso/medidas (ficam só retirada): <strong>{resumo.sem}</strong> · marcados só retirada: <strong>{resumo.retirada}</strong>.
            Preencha peso e medidas do pacote na aba Produtos para liberar o envio de cada um.
          </p>
        )}
        <div className="admin-linha">
          <div className="campo">
            <label htmlFor="co-usuario">Usuário (Meu Correios)</label>
            <input id="co-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off"
              placeholder={status.correios.usuario.preenchido ? '•••••• já preenchido — vazio mantém' : ''} />
          </div>
          <div className="campo">
            <label htmlFor="co-codigo">Código de acesso às APIs</label>
            <input id="co-codigo" type="password" value={codigoAcesso} onChange={(e) => setCodigoAcesso(e.target.value)} autoComplete="new-password"
              placeholder={status.correios.codigoAcesso.preenchido ? '•••••• já preenchido — vazio mantém' : ''} />
          </div>
        </div>
        <div className="admin-linha">
          <div className="campo campo-medio">
            <label htmlFor="co-cartao">Cartão de postagem</label>
            <input id="co-cartao" inputMode="numeric" value={cartao} onChange={(e) => setCartao(e.target.value)} />
          </div>
          <div className="campo campo-medio">
            <label htmlFor="co-contrato">Contrato</label>
            <input id="co-contrato" inputMode="numeric" value={contrato} onChange={(e) => setContrato(e.target.value)} />
          </div>
          <div className="campo campo-curto">
            <label htmlFor="co-dr">DR</label>
            <input id="co-dr" inputMode="numeric" value={dr} onChange={(e) => setDr(e.target.value)} />
          </div>
          <div className="campo campo-medio">
            <label htmlFor="co-cep">CEP de origem</label>
            <input id="co-cep" inputMode="numeric" placeholder="00000-000" value={cepOrigem} onChange={(e) => setCepOrigem(e.target.value)} />
          </div>
        </div>

        <fieldset className="campo">
          <legend>Serviços oferecidos (código do seu contrato)</legend>
          {servicos.map((s, i) => (
            <div key={i} className="admin-linha">
              <label className="radio">
                <input type="checkbox" checked={s.ativo} onChange={(e) => mudaServico(i, { ativo: e.target.checked })} /> Ativo
              </label>
              <div className="campo campo-medio">
                <input aria-label="Nome exibido ao cliente" value={s.nome} onChange={(e) => mudaServico(i, { nome: e.target.value })} />
              </div>
              <div className="campo campo-curto">
                <input aria-label="Código do serviço (5 números)" inputMode="numeric" maxLength={5} value={s.codigo} onChange={(e) => mudaServico(i, { codigo: e.target.value.replace(/\D/g, '') })} />
              </div>
              <button type="button" className="btn btn-secundario" onClick={() => setServicos((l) => l.filter((_, k) => k !== i))}>Tirar</button>
            </div>
          ))}
          <div>
            <button type="button" className="btn btn-secundario" onClick={() => setServicos((l) => [...l, { codigo: '', nome: '', ativo: true }])}>+ Adicionar serviço</button>
          </div>
          <span className="dica">Os códigos de PAC e SEDEX do seu contrato podem ser diferentes dos de balcão (03298 e 03220 são os padrões). Confira no seu contrato.</span>
        </fieldset>

        <div className="admin-linha">
          <div className="campo campo-medio">
            <label htmlFor="co-emb">Embalagem (R$ somados)</label>
            <input id="co-emb" inputMode="decimal" placeholder="0,00" value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} />
          </div>
          <div className="campo campo-medio">
            <label htmlFor="co-gratis">Frete grátis acima de (R$)</label>
            <input id="co-gratis" inputMode="decimal" placeholder="vazio = não tem" value={gratis} onChange={(e) => setGratis(e.target.value)} />
          </div>
          <div className="campo campo-curto">
            <label htmlFor="co-dias">+ dias no prazo</label>
            <input id="co-dias" inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} />
          </div>
        </div>
        {msgFrete && <p className="dica" role="status">{msgFrete}</p>}
        <div className="admin-acoes">
          <button className="btn btn-primario" disabled={ocupado}>Salvar</button>
          <button type="button" className="btn btn-secundario" disabled={ocupado} onClick={() => testar('correios', setMsgFrete)}>Testar conexão</button>
        </div>
      </form>
      )}
    </div>
  )
}
