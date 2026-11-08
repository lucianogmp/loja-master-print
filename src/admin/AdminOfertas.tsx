import { useCallback, useEffect, useState } from 'react'
import { erp } from '../lib/erp'
import { useCatalogo } from '../lib/catalogo'
import { useSite } from '../lib/site'
import { brl } from '../lib/format'
import { slugDe } from '../lib/ofertas'
import { percentualDesconto, precoComPromocao, type Promocao } from '../lib/promocao'
import type { Produto } from '../lib/tipos'
import { diasEntre, hojeISO, janelaDaData, proximaOcorrencia, type RegraData } from '../lib/datasComerciais'

type Data = {
  id: string
  nome: string
  regra: RegraData
  mes: number | null
  dia: number | null
  dias_antecedencia: number
  ativa: boolean
  site_mostrar: boolean
  site_titulo: string | null
  site_texto: string | null
  site_dias_antes: number | null
}

const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

type PromoMap = Map<string, Promocao>
const num = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Uma linha de produto da campanha: preço do ERP e a promoção do site (%, ou "por" em reais). */
function PromoProduto({ produto, promo, onSalvo }: { produto: Produto; promo?: Promocao; onSalvo: () => void }) {
  const de = promo ? produto.precoOriginal ?? produto.variacoes[0]?.preco ?? 0 : produto.variacoes[0]?.preco ?? 0
  const [tipo, setTipo] = useState<'' | Promocao['tipo']>(promo?.tipo ?? '')
  const [valor, setValor] = useState(promo ? String(promo.valor).replace('.', ',') : '')
  const [msg, setMsg] = useState('')
  const v = num(valor)
  const por = tipo && v ? precoComPromocao(de, { tipo, valor: v }) : de
  const erroValor = tipo && (!v || por >= de) ? (tipo === 'percentual' ? 'Use um desconto entre 0 e 100%.' : `Use um preço abaixo de ${brl(de)}.`) : ''

  async function salvar() {
    if (erroValor) return setMsg(erroValor)
    const { data, error } = await erp
      .from('loja_produtos')
      .update({ promo_tipo: tipo || null, promo_valor: tipo ? v : null })
      .eq('produto_id', produto.id)
      .select('produto_id')
    if (error) return setMsg('Não foi possível salvar.')
    if (!data?.length) return setMsg('Abra o produto em Produtos e salve uma vez (foto/descrição) antes de colocar promoção.')
    setMsg('Salvo.')
    onSalvo()
  }

  return (
    <li className="oferta-produto">
      <span className="oferta-produto-nome">
        {produto.nome} <small>{brl(de)}</small>
      </span>
      <div className="medidas-linha">
        <select className="ed-select" aria-label={`Promoção de ${produto.nome}`} value={tipo} onChange={(e) => { setTipo(e.target.value as '' | Promocao['tipo']); setValor('') }}>
          <option value="">Sem promoção</option>
          <option value="percentual">Desconto %</option>
          <option value="preco">Preço “por”</option>
        </select>
        {tipo && (
          <input inputMode="decimal" aria-label={tipo === 'percentual' ? `Desconto de ${produto.nome} em %` : `Preço promocional de ${produto.nome}`} placeholder={tipo === 'percentual' ? '10' : '0,00'} value={valor} onChange={(e) => setValor(e.target.value)} />
        )}
        {tipo && !erroValor && <span className="ed-previa"><s>{brl(de)}</s> <strong>{brl(por)}</strong> <span className="badge-promo">-{percentualDesconto(de, por)}%</span></span>}
        <button type="button" className="btn btn-secundario" onClick={salvar}>Salvar</button>
        {(msg || erroValor) && <span className="dica" role="status">{msg || erroValor}</span>}
      </div>
    </li>
  )
}

function Linha({ d, produtos, lista, promos, onSalvo }: { d: Data; produtos: number; lista: Produto[]; promos: PromoMap; onSalvo: () => void }) {
  const { banners, recarregar } = useSite()
  const slug = slugDe(d.nome) || d.id
  const temBanner = banners.itens.some((b) => b.tipo === 'oferta' && b.destino === slug)

  async function criarBanner() {
    const novo = { id: `b${Date.now().toString(36)}`, imagem: '', alt: `Ofertas de ${d.nome}`, ativo: true, tipo: 'oferta', destino: slug }
    const { error } = await erp.from('loja_config').upsert({ chave: 'banners', valor: { ...banners, itens: [...banners.itens, novo] }, atualizado_em: new Date().toISOString() })
    if (error) return setMsg('Não foi possível criar o banner.')
    await recarregar()
    setMsg('Banner criado. Vá na aba Banners e envie a imagem (ele só aparece quando tiver imagem).')
  }
  const [f, setF] = useState(d)
  const [msg, setMsg] = useState('')
  useEffect(() => setF(d), [d])

  const diasAntes = f.site_dias_antes ?? f.dias_antecedencia
  const alvo = proximaOcorrencia(f)
  const faltam = diasEntre(hojeISO(), alvo)
  const noAr = janelaDaData(f, diasAntes) !== null
  const status = !d.ativa
    ? 'Data desativada no ERP'
    : !f.site_mostrar
      ? 'Desligada no site'
      : produtos === 0
        ? 'Sem produtos publicados (não aparece)'
        : noAr
          ? 'No ar agora'
          : `Entra no ar em ${faltam - diasAntes} dia(s)`

  async function salvar() {
    const { error } = await erp
      .from('datas_comerciais')
      .update({
        site_mostrar: f.site_mostrar,
        site_titulo: f.site_titulo?.trim() || null,
        site_texto: f.site_texto?.trim() || null,
        site_dias_antes: f.site_dias_antes || null,
      })
      .eq('id', d.id)
    if (error) return setMsg('Não foi possível salvar.')
    setMsg('Salvo.')
    onSalvo()
  }

  return (
    <li className="oferta-admin">
      <div className="oferta-admin-topo">
        <strong>{d.nome}</strong>
        <span className="dica">
          {fmt(alvo)} · {produtos} produto(s) no site · <b>{status}</b>
        </span>
      </div>
      <label className="radio">
        <input type="checkbox" checked={f.site_mostrar} onChange={(e) => setF({ ...f, site_mostrar: e.target.checked })} />
        <span>Mostrar no site</span>
      </label>
      <div className="admin-linha">
        <div className="campo">
          <label htmlFor={`ot-${d.id}`}>Título no site</label>
          <input
            id={`ot-${d.id}`}
            placeholder={`Ofertas de ${d.nome}`}
            value={f.site_titulo ?? ''}
            onChange={(e) => setF({ ...f, site_titulo: e.target.value })}
          />
        </div>
        <div className="campo">
          <label htmlFor={`od-${d.id}`}>Aparece quantos dias antes</label>
          <input
            id={`od-${d.id}`}
            type="number"
            min={1}
            max={365}
            placeholder={String(d.dias_antecedencia)}
            value={f.site_dias_antes ?? ''}
            onChange={(e) => setF({ ...f, site_dias_antes: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>
      <div className="campo">
        <label htmlFor={`ox-${d.id}`}>Texto curto (opcional)</label>
        <input id={`ox-${d.id}`} value={f.site_texto ?? ''} onChange={(e) => setF({ ...f, site_texto: e.target.value })} />
      </div>
      {lista.length > 0 && (
        <details>
          <summary className="dica">Preço promocional dos produtos desta campanha ({lista.length})</summary>
          <ul className="lista-admin">
            {lista.map((p) => (
              <PromoProduto key={p.id} produto={p} promo={promos.get(p.id)} onSalvo={onSalvo} />
            ))}
          </ul>
        </details>
      )}
      <div className="admin-linha admin-linha-centro">
        <button type="button" className="btn btn-primario" onClick={salvar}>
          Salvar {d.nome}
        </button>
        <button type="button" className="btn btn-secundario" onClick={criarBanner} disabled={temBanner}>
          {temBanner ? 'Banner desta oferta já existe' : 'Criar banner desta oferta'}
        </button>
        {msg && <span className="dica" role="status">{msg}</span>}
      </div>
    </li>
  )
}

export default function AdminOfertas() {
  const { produtos } = useCatalogo()
  const [datas, setDatas] = useState<Data[]>([])
  const [ligacoes, setLigacoes] = useState<{ data_id: string; produto_id: string }[]>([])
  const [promos, setPromos] = useState<PromoMap>(new Map())
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const [d, l, pr] = await Promise.all([
      erp.from('datas_comerciais').select('*').order('nome'),
      erp.from('datas_comerciais_produtos').select('data_id, produto_id'),
      erp.from('loja_produtos').select('produto_id, promo_tipo, promo_valor').not('promo_tipo', 'is', null),
    ])
    if (d.error || l.error) setErro('Não foi possível carregar as datas.')
    else {
      setDatas((d.data ?? []) as Data[])
      setLigacoes((l.data ?? []) as { data_id: string; produto_id: string }[])
      setPromos(new Map(((pr.data ?? []) as { produto_id: string; promo_tipo: Promocao['tipo']; promo_valor: number }[]).map((x) => [x.produto_id, { tipo: x.promo_tipo, valor: Number(x.promo_valor) }])))
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const publicados = new Set(produtos.filter((p) => !p.derivadoId).map((p) => p.id))
  const produtosDa = (id: string) => {
    const ids = new Set(ligacoes.filter((x) => x.data_id === id).map((x) => x.produto_id))
    return produtos.filter((p) => ids.has(p.id) && !p.derivadoId)
  }
  const contar = (id: string) => ligacoes.filter((x) => x.data_id === id && publicados.has(x.produto_id)).length

  return (
    <div className="admin-form">
      <h2 className="admin-sub">Ofertas por data comercial</h2>
      <p className="dica">
        As datas e os produtos de cada campanha são cadastrados no seu sistema (Produtos &gt; Datas Comerciais), onde também se ativa a
        campanha no site. Aqui você define como ela aparece: título, texto, quando entra, o preço promocional de cada produto e o banner.
        Campanha desligada ou sem produtos publicados não aparece.
      </p>
      {erro && <p className="dica" role="alert">{erro}</p>}
      {carregando ? (
        <p className="vazio">Carregando...</p>
      ) : (
        <ul className="lista-admin">
          {datas.map((d) => (
            <Linha key={d.id} d={d} produtos={contar(d.id)} lista={produtosDa(d.id)} promos={promos} onSalvo={carregar} />
          ))}
        </ul>
      )}
    </div>
  )
}
