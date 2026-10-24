import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { erp } from '../lib/erp'
import AutoTextarea from '../components/AutoTextarea'

type Item = { id: string; nome: string; categoria: string | null; lp: LP | null }
type LP = {
  slug: string
  descricao_publica: string | null
  imagens: string[]
  peso_kg: number | null
  comprimento_cm: number | null
  largura_cm: number | null
  altura_cm: number | null
  entrega_modo: 'envio_e_retirada' | 'so_retirada'
  destaque: boolean
  ordem: number
}

// Aceita vírgula decimal (0,4) e devolve null se vazio/inválido.
const num = (v: string): number | null => {
  const n = Number(v.replace(',', '.'))
  return v.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function AdminProdutos() {
  const [itens, setItens] = useState<Item[]>([])
  const [aberto, setAberto] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { data: prods } = await erp
      .from('produtos')
      .select('id, nome, categorias(nome)')
      .eq('publicar_no_catalogo', true)
      .order('nome')
    const { data: lps } = await erp.from('loja_produtos').select('*')
    const porId = new Map((lps ?? []).map((l: LP & { produto_id: string }) => [l.produto_id, l]))
    setItens(
      (prods ?? []).map((p: { id: string; nome: string; categorias: { nome: string } | { nome: string }[] | null }) => ({
        id: p.id,
        nome: p.nome,
        categoria: Array.isArray(p.categorias) ? p.categorias[0]?.nome ?? null : p.categorias?.nome ?? null,
        lp: (porId.get(p.id) as LP | undefined) ?? null,
      })),
    )
    setCarregando(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  return (
    <div>
      <p className="dica">
        Aqui aparecem os produtos marcados com "Aparece no site" no ERP. Cadastre foto, descrição e dados de envio (peso e tamanho do pacote) de cada um.
      </p>
      {carregando && <p>Carregando...</p>}
      {!carregando && itens.length === 0 && <p className="vazio">Nenhum produto marcado no ERP ainda.</p>}
      <ul className="lista-admin">
        {itens.map((it) => (
          <li key={it.id} className="admin-item">
            <div className="admin-item-topo">
              <div>
                <strong>{it.nome}</strong>
                <small> · {it.categoria ?? 'sem categoria'}</small>
                {!it.lp && <small className="aviso-admin"> · sem foto/descrição</small>}
              </div>
              <button className="btn btn-secundario" onClick={() => setAberto(aberto === it.id ? null : it.id)}>
                {aberto === it.id ? 'Fechar' : 'Editar'}
              </button>
            </div>
            {aberto === it.id && <Editor item={it} aoSalvar={() => { carregar(); setAberto(null) }} />}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Editor({ item, aoSalvar }: { item: Item; aoSalvar: () => void }) {
  const [slug, setSlug] = useState(item.lp?.slug ?? slugify(item.nome))
  const [descricao, setDescricao] = useState(item.lp?.descricao_publica ?? '')
  const [peso, setPeso] = useState(item.lp?.peso_kg != null ? String(item.lp.peso_kg) : '')
  const [comp, setComp] = useState(item.lp?.comprimento_cm != null ? String(item.lp.comprimento_cm) : '')
  const [larg, setLarg] = useState(item.lp?.largura_cm != null ? String(item.lp.largura_cm) : '')
  const [alt, setAlt] = useState(item.lp?.altura_cm != null ? String(item.lp.altura_cm) : '')
  const [modo, setModo] = useState<'envio_e_retirada' | 'so_retirada'>(item.lp?.entrega_modo ?? 'envio_e_retirada')
  const [destaque, setDestaque] = useState(item.lp?.destaque ?? false)
  const [ordem, setOrdem] = useState(item.lp?.ordem ?? 0)
  const [imagens, setImagens] = useState<string[]>(item.lp?.imagens ?? [])
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function subir(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!arquivos.length) return
    setEnviando(true)
    setMsg('')
    const novas: string[] = []
    for (const f of arquivos) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { setMsg('Use JPG, PNG ou WebP.'); continue }
      if (f.size > 5 * 1024 * 1024) { setMsg('Imagem acima de 5 MB foi ignorada.'); continue }
      const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg'
      const caminho = `${item.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await erp.storage.from('loja-produtos').upload(caminho, f, { contentType: f.type })
      if (error) { setMsg('Falha ao enviar uma imagem.'); continue }
      novas.push(erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl)
    }
    setImagens((a) => [...a, ...novas])
    setEnviando(false)
  }

  const principal = (i: number) => setImagens((a) => [a[i], ...a.filter((_, k) => k !== i)])
  const remover = (i: number) => setImagens((a) => a.filter((_, k) => k !== i))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const s = slugify(slug)
    if (modo === 'envio_e_retirada' && [peso, comp, larg, alt].some((v) => v.trim() !== '') && [peso, comp, larg, alt].some((v) => num(v) === null)) {
      return setMsg('Preencha peso e as 3 medidas do pacote (ou deixe todos vazios).')
    }
    if (!s) return setMsg('Endereço (slug) inválido.')
    const { error } = await erp.from('loja_produtos').upsert({
      produto_id: item.id,
      slug: s,
      descricao_publica: descricao.trim() || null,
      imagens,
      peso_kg: num(peso),
      comprimento_cm: num(comp),
      largura_cm: num(larg),
      altura_cm: num(alt),
      entrega_modo: modo,
      destaque,
      ordem,
    })
    if (error) return setMsg(error.message.includes('duplicate') ? 'Esse endereço já é de outro produto.' : 'Não foi possível salvar.')
    aoSalvar()
  }

  return (
    <form className="admin-form" onSubmit={salvar}>
      <div className="campo">
        <label>Fotos (a primeira é a principal)</label>
        <div className="admin-fotos">
          {imagens.map((u, i) => (
            <div key={u} className="admin-foto">
              <img src={u} alt="" />
              <div>
                {i > 0 && <button type="button" className="link-botao" onClick={() => principal(i)}>Principal</button>}
                <button type="button" className="link-botao" onClick={() => remover(i)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={subir} disabled={enviando} />
        <span className="dica">{enviando ? 'Enviando...' : 'JPG, PNG ou WebP, até 5 MB cada.'}</span>
      </div>
      <div className="campo">
        <label htmlFor={`d${item.id}`}>Descrição</label>
        <AutoTextarea id={`d${item.id}`} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <fieldset className="campo opcoes-arte">
        <legend>Envio</legend>
        <label className="radio">
          <input type="radio" name={`m${item.id}`} checked={modo === 'envio_e_retirada'} onChange={() => setModo('envio_e_retirada')} />
          Envia pelos Correios e também retira na gráfica
        </label>
        <label className="radio">
          <input type="radio" name={`m${item.id}`} checked={modo === 'so_retirada'} onChange={() => setModo('so_retirada')} />
          Somente retirada na gráfica
        </label>
        {modo === 'envio_e_retirada' && (
          <>
            <div className="medidas-linha">
              <label>Peso <input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0,4" aria-label="Peso em kg" /> kg</label>
              <label>Pacote <input inputMode="decimal" value={comp} onChange={(e) => setComp(e.target.value)} placeholder="C" aria-label="Comprimento em cm" />
                × <input inputMode="decimal" value={larg} onChange={(e) => setLarg(e.target.value)} placeholder="L" aria-label="Largura em cm" />
                × <input inputMode="decimal" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="A" aria-label="Altura em cm" /> cm</label>
            </div>
            <span className="dica">Pacote já embalado (comprimento × largura × altura). Usado no cálculo do frete.</span>
          </>
        )}
      </fieldset>
      <details>
        <summary className="dica">Avançado: endereço da página (slug)</summary>
        <div className="campo">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
          <span className="dica">Gerado automaticamente a partir do nome. Só mude se precisar.</span>
        </div>
      </details>
      <div className="medidas-linha">
        <label className="radio"><input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} /> Destaque na página inicial</label>
        <label>Ordem <input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value) || 0)} /></label>
      </div>
      {msg && <p className="dica" role="alert">{msg}</p>}
      <button className="btn btn-primario">Salvar</button>
    </form>
  )
}
