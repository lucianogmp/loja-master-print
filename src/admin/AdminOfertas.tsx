import { useCallback, useEffect, useState } from 'react'
import { erp } from '../lib/erp'
import { useCatalogo } from '../lib/catalogo'
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

function Linha({ d, produtos, onSalvo }: { d: Data; produtos: number; onSalvo: () => void }) {
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
      <div className="admin-linha admin-linha-centro">
        <button type="button" className="btn btn-primario" onClick={salvar}>
          Salvar {d.nome}
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
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const [d, l] = await Promise.all([
      erp.from('datas_comerciais').select('*').order('nome'),
      erp.from('datas_comerciais_produtos').select('data_id, produto_id'),
    ])
    if (d.error || l.error) setErro('Não foi possível carregar as datas.')
    else {
      setDatas((d.data ?? []) as Data[])
      setLigacoes((l.data ?? []) as { data_id: string; produto_id: string }[])
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const publicados = new Set(produtos.filter((p) => !p.derivadoId).map((p) => p.id))
  const contar = (id: string) => ligacoes.filter((x) => x.data_id === id && publicados.has(x.produto_id)).length

  return (
    <div className="admin-form">
      <h2 className="admin-sub">Ofertas por data comercial</h2>
      <p className="dica">
        As datas e os produtos de cada campanha são cadastrados no seu sistema (Produtos &gt; Datas Comerciais). Aqui você só
        decide como cada uma aparece no site: perto da data, a loja mostra sozinha “Ofertas de …” com os produtos da campanha.
      </p>
      {erro && <p className="dica" role="alert">{erro}</p>}
      {carregando ? (
        <p className="vazio">Carregando...</p>
      ) : (
        <ul className="lista-admin">
          {datas.map((d) => (
            <Linha key={d.id} d={d} produtos={contar(d.id)} onSalvo={carregar} />
          ))}
        </ul>
      )}
    </div>
  )
}
