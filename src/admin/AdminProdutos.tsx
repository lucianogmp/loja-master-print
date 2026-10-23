import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { erp } from '../lib/erp'

type Item = { id: string; nome: string; categoria: string | null; lp: LP | null }
type LP = {
  slug: string
  descricao_publica: string | null
  imagens: string[]
  medidas: string | null
  info_envio: string | null
  destaque: boolean
  ordem: number
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
        Aqui aparecem os produtos marcados com "Aparece no site" no ERP. Cadastre foto, descrição, medidas e envio de cada um.
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
  const [medidas, setMedidas] = useState(item.lp?.medidas ?? '')
  const [envio, setEnvio] = useState(item.lp?.info_envio ?? '')
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
    if (!s) return setMsg('Endereço (slug) inválido.')
    const { error } = await erp.from('loja_produtos').upsert({
      produto_id: item.id,
      slug: s,
      descricao_publica: descricao.trim() || null,
      imagens,
      medidas: medidas.trim() || null,
      info_envio: envio.trim() || null,
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
        <textarea id={`d${item.id}`} rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="campo-linha">
        <div className="campo"><label>Medidas</label>
          <input value={medidas} onChange={(e) => setMedidas(e.target.value)} placeholder="ex.: A3 — 29,7 x 42 cm" /></div>
        <div className="campo"><label>Endereço (slug)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
      </div>
      <div className="campo">
        <label>Informações de envio</label>
        <textarea rows={2} value={envio} onChange={(e) => setEnvio(e.target.value)} />
      </div>
      <div className="campo-linha">
        <label className="radio"><input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} /> Destaque na página inicial</label>
        <div className="campo"><label>Ordem</label>
          <input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value) || 0)} /></div>
      </div>
      {msg && <p className="dica" role="alert">{msg}</p>}
      <button className="btn btn-primario">Salvar</button>
    </form>
  )
}
