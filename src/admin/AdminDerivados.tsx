import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { erp } from '../lib/erp'
import { brl } from '../lib/format'
import AutoTextarea from '../components/AutoTextarea'

type Base = { id: string; nome: string; preco_venda: number | null }
type Der = {
  id: string
  produto_id: string
  slug: string
  nome: string
  descricao: string | null
  imagens: string[]
  arte_nome: string | null
  arte_arquivo: string | null
  visivel: boolean
  destaque: boolean
  ordem: number
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export default function AdminDerivados() {
  const [bases, setBases] = useState<Base[]>([])
  const [lista, setLista] = useState<Der[]>([])
  const [aberto, setAberto] = useState<string | null>(null) // id aberto; 'novo' = criando
  const [msg, setMsg] = useState('')

  const carregar = useCallback(async () => {
    const [b, d] = await Promise.all([
      erp.from('produtos').select('id,nome,preco_venda').eq('publicar_no_catalogo', true).eq('status', 'ativo').order('nome'),
      erp.from('loja_derivados').select('*').order('ordem').order('nome'),
    ])
    setBases((b.data as Base[]) ?? [])
    setLista((d.data as Der[]) ?? [])
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  const nomeBase = (id: string) => bases.find((b) => b.id === id)?.nome ?? 'produto base indisponível'

  async function duplicar(d: Der) {
    const slug = `${d.slug}-copia`.slice(0, 80)
    const { error } = await erp.from('loja_derivados').insert({
      produto_id: d.produto_id, slug, nome: `${d.nome} (cópia)`, descricao: d.descricao, imagens: d.imagens,
      arte_nome: d.arte_nome, arte_arquivo: d.arte_arquivo, visivel: false, destaque: false, ordem: d.ordem,
    })
    setMsg(error ? 'Não foi possível duplicar (talvez já exista uma cópia; renomeie ou exclua).' : 'Cópia criada como rascunho (oculta). Edite a foto e a arte.')
    carregar()
  }

  return (
    <div className="admin-form">
      <p className="dica">
        Produto derivado = um produto do ERP (preço, prazo e produção) com <strong>arte pronta própria</strong>: foto/mockup, descrição e o arquivo da arte são seus.
        No pedido, entra no ERP como o produto base, com o nome da arte e o link do arquivo anotados no item.
      </p>
      <ul className="lista-admin">
        {lista.map((d) => (
          <li key={d.id} className="admin-item">
            <div className="admin-item-topo">
              <span>
                <strong>{d.nome}</strong>
                <small> · base: {nomeBase(d.produto_id)}</small>
                {!d.visivel && <small className="aviso-admin"> · oculto</small>}
                {!d.arte_arquivo && <small className="aviso-admin"> · sem arquivo da arte</small>}
              </span>
              <span className="conta-acoes">
                <button type="button" className="link-botao" onClick={() => duplicar(d)}>Duplicar</button>
                <button className="btn btn-secundario" onClick={() => setAberto(aberto === d.id ? null : d.id)}>
                  {aberto === d.id ? 'Fechar' : 'Editar'}
                </button>
              </span>
            </div>
            {aberto === d.id && (
              <Editor key={d.id} inicial={d} existe bases={bases} aoSalvar={(t) => { setAberto(null); setMsg(t); carregar() }} />
            )}
          </li>
        ))}
      </ul>
      {aberto === 'novo' ? (
        <Editor
          key="novo"
          bases={bases}
          existe={false}
          inicial={{
            id: crypto.randomUUID(), produto_id: '', slug: '', nome: '', descricao: '', imagens: [], arte_nome: '', arte_arquivo: null,
            visivel: true, destaque: false, ordem: 0,
          }}
          aoSalvar={(t) => { setAberto(null); setMsg(t); carregar() }}
        />
      ) : (
        <div>
          <button className="btn btn-secundario" onClick={() => setAberto('novo')}>Novo produto derivado</button>
        </div>
      )}
      {msg && <p className="dica" role="status">{msg}</p>}
    </div>
  )
}

function Editor({ inicial, existe, bases, aoSalvar }: { inicial: Der; existe: boolean; bases: Base[]; aoSalvar: (msg: string) => void }) {
  const [f, setF] = useState<Der>({ ...inicial, descricao: inicial.descricao ?? '', arte_nome: inicial.arte_nome ?? '' })
  const [slugManual, setSlugManual] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState('')
  const set = <K extends keyof Der>(k: K, v: Der[K]) => setF((x) => ({ ...x, [k]: v }))
  const base = bases.find((b) => b.id === f.produto_id)

  async function subirFotos(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!arquivos.length) return
    setEnviando('fotos')
    setErro('')
    const novas: string[] = []
    for (const a of arquivos) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(a.type)) { setErro('Fotos: use JPG, PNG ou WebP.'); continue }
      if (a.size > 5 * 1024 * 1024) { setErro('Foto acima de 5 MB ignorada.'); continue }
      const ext = a.type === 'image/png' ? 'png' : a.type === 'image/webp' ? 'webp' : 'jpg'
      const caminho = `derivados/${f.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await erp.storage.from('loja-produtos').upload(caminho, a, { contentType: a.type })
      if (error) { setErro('Falha ao enviar uma foto.'); continue }
      novas.push(erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl)
    }
    setF((x) => ({ ...x, imagens: [...x.imagens, ...novas] }))
    setEnviando('')
  }

  async function subirArte(e: ChangeEvent<HTMLInputElement>) {
    const a = e.target.files?.[0]
    e.target.value = ''
    if (!a) return
    if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(a.type)) return setErro('Arte: use PDF, PNG, JPG, WebP ou SVG.')
    if (a.size > 50 * 1024 * 1024) return setErro('Arquivo da arte acima de 50 MB.')
    setEnviando('arte')
    setErro('')
    const nomeSeguro = a.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-')
    const caminho = `${crypto.randomUUID()}/${nomeSeguro}`
    const { error } = await erp.storage.from('loja-artes').upload(caminho, a, { contentType: a.type })
    setEnviando('')
    if (error) return setErro('Falha ao enviar o arquivo da arte.')
    set('arte_arquivo', erp.storage.from('loja-artes').getPublicUrl(caminho).data.publicUrl)
  }

  const principal = (i: number) => set('imagens', [f.imagens[i], ...f.imagens.filter((_, k) => k !== i)])
  const remover = (i: number) => set('imagens', f.imagens.filter((_, k) => k !== i))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const slug = slugify(f.slug || f.nome)
    if (!f.produto_id) return setErro('Escolha o produto base.')
    if (!f.nome.trim()) return setErro('Dê um nome ao produto.')
    if (!slug) return setErro('Endereço (slug) inválido.')
    // o endereço não pode ser igual ao de um produto comum
    const { data: igual } = await erp.from('loja_produtos').select('produto_id').eq('slug', slug).maybeSingle()
    if (igual) return setErro('Esse endereço já é de um produto comum. Mude o nome ou o endereço.')
    const linha = {
      id: f.id, produto_id: f.produto_id, slug, nome: f.nome.trim(), descricao: f.descricao?.trim() || null, imagens: f.imagens,
      arte_nome: f.arte_nome?.trim() || null, arte_arquivo: f.arte_arquivo, visivel: f.visivel, destaque: f.destaque, ordem: f.ordem,
      atualizado_em: new Date().toISOString(),
    }
    const { error } = existe ? await erp.from('loja_derivados').update(linha).eq('id', f.id) : await erp.from('loja_derivados').insert(linha)
    if (error) return setErro(error.message.includes('duplicate') ? 'Esse endereço já está em uso por outro derivado.' : 'Não foi possível salvar.')
    aoSalvar(f.visivel ? 'Salvo e publicado.' : 'Salvo como oculto.')
  }

  async function excluir() {
    if (!window.confirm(`Excluir "${f.nome}"? Os pedidos já feitos não são afetados.`)) return
    const { error } = await erp.from('loja_derivados').delete().eq('id', f.id)
    if (error) return setErro('Não foi possível excluir.')
    aoSalvar('Produto derivado excluído.')
  }

  return (
    <form className="admin-form" onSubmit={salvar}>
      <div className="linha-campos">
        <div className="campo">
          <label htmlFor={`d-base-${f.id}`}>Produto base (do ERP)</label>
          <select id={`d-base-${f.id}`} value={f.produto_id} onChange={(e) => set('produto_id', e.target.value)}>
            <option value="">Escolha...</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>{b.nome}{b.preco_venda ? ` — ${brl(b.preco_venda)}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`d-nome-${f.id}`}>Nome do produto</label>
          <input
            id={`d-nome-${f.id}`}
            value={f.nome}
            placeholder="ex.: Banner Alfabeto"
            onChange={(e) => {
              set('nome', e.target.value)
              if (!existe && !slugManual) set('slug', slugify(e.target.value))
            }}
          />
        </div>
      </div>
      {base && <span className="dica">Preço e produção vêm do ERP: {base.preco_venda ? brl(base.preco_venda) : 'sem preço (sob consulta)'}.</span>}

      <div className="campo">
        <label>Fotos / mockups</label>
        <div className="admin-fotos">
          {f.imagens.map((u, i) => (
            <div key={u} className="admin-foto">
              <img src={u} alt="" />
              <div>
                {i > 0 && <button type="button" className="link-botao" onClick={() => principal(i)}>Principal</button>}
                <button type="button" className="link-botao" onClick={() => remover(i)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={subirFotos} />
        <span className="dica">{enviando === 'fotos' ? 'Enviando...' : 'Mostre o produto pronto (JPG, PNG ou WebP, até 5 MB cada).'}</span>
      </div>

      <div className="campo">
        <label htmlFor={`d-desc-${f.id}`}>Descrição</label>
        <AutoTextarea id={`d-desc-${f.id}`} rows={3} value={f.descricao ?? ''} onChange={(e) => set('descricao', e.target.value)} />
      </div>

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor={`d-arte-${f.id}`}>Nome ou código da arte</label>
          <input id={`d-arte-${f.id}`} value={f.arte_nome ?? ''} placeholder="ex.: Alfabeto colorido v2" onChange={(e) => set('arte_nome', e.target.value)} />
        </div>
        <div className="campo">
          <label>Arquivo da arte (para produção)</label>
          <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/svg+xml" onChange={subirArte} />
        </div>
      </div>
      <span className="dica">
        {enviando === 'arte' ? 'Enviando a arte...' : f.arte_arquivo ? (<>Arquivo atual: <a href={f.arte_arquivo} target="_blank" rel="noreferrer">abrir</a> · <button type="button" className="link-botao" onClick={() => set('arte_arquivo', null)}>remover</button> · </>) : 'Nenhum arquivo enviado. '}
        PDF, PNG, JPG, WebP ou SVG, até 50 MB. O link vai anotado no item do orçamento, no ERP.
      </span>

      <div className="medidas-linha">
        <label className="radio"><input type="checkbox" checked={f.visivel} onChange={(e) => set('visivel', e.target.checked)} /> Visível no site</label>
        <label className="radio"><input type="checkbox" checked={f.destaque} onChange={(e) => set('destaque', e.target.checked)} /> Destaque na página inicial</label>
        <label>Ordem <input type="number" value={f.ordem} onChange={(e) => set('ordem', Number(e.target.value) || 0)} /></label>
      </div>
      {!existe && (
        <details>
          <summary className="dica">Avançado: endereço da página (slug)</summary>
          <div className="campo">
            <input aria-label="Endereço" value={f.slug} onChange={(e) => { setSlugManual(true); set('slug', slugify(e.target.value)) }} />
            <span className="dica">Ficará em /produto/{f.slug || '...'}</span>
          </div>
        </details>
      )}
      {erro && <p className="dica" role="alert">{erro}</p>}
      <div className="linha-campos linha-centro">
        <button className="btn btn-primario" disabled={!!enviando}>Salvar</button>
        {existe && (
          <>
            <a className="link-botao" href={`/produto/${f.slug}`} target="_blank" rel="noreferrer">Ver no site</a>
            <button type="button" className="link-botao" onClick={excluir}>Excluir</button>
          </>
        )}
      </div>
    </form>
  )
}
