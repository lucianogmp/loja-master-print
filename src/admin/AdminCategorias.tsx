import { useCallback, useEffect, useRef, useState } from 'react'
import { erp } from '../lib/erp'
import { recarregarAjustes } from '../lib/ajustes'

type Cat = { id: string; nome: string; publicados: number; nome_publico: string; imagem: string | null; ordem: number }

export default function AdminCategorias() {
  const [cats, setCats] = useState<Cat[]>([])
  const [todas, setTodas] = useState(false)
  const [msg, setMsg] = useState('')
  const [destaques, setDestaques] = useState<string[]>([])

  const carregar = useCallback(async () => {
    const [c, p, lc, aj] = await Promise.all([
      erp.from('categorias').select('id,nome').order('nome'),
      erp.from('produtos').select('categoria_id').eq('publicar_no_catalogo', true).eq('status', 'ativo'),
      erp.from('loja_categorias').select('categoria_id,nome_publico,imagem,ordem'),
      erp.from('loja_menu_destaques').select('slug,ordem').order('ordem'),
    ])
    setDestaques(((aj.data ?? []) as { slug: string }[]).map((x) => x.slug))
    const cont = new Map<string, number>()
    ;(p.data ?? []).forEach((r: { categoria_id: string | null }) => r.categoria_id && cont.set(r.categoria_id, (cont.get(r.categoria_id) ?? 0) + 1))
    const extra = new Map((lc.data ?? []).map((r: { categoria_id: string; nome_publico: string | null; imagem: string | null; ordem: number }) => [r.categoria_id, r]))
    setCats(
      (c.data ?? []).map((r: { id: string; nome: string }) => {
        const e = extra.get(r.id)
        return { id: r.id, nome: r.nome, publicados: cont.get(r.id) ?? 0, nome_publico: e?.nome_publico ?? '', imagem: e?.imagem ?? null, ordem: e?.ordem ?? 0 }
      }),
    )
  }, [])
  useEffect(() => { carregar() }, [carregar])

  // Identificador da categoria no site = nome da categoria no ERP sem acento/espaço (o mesmo do link ?categoria=)
  const slugDe = (c: Pick<Cat, 'nome'>) =>
    c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const noTopo = (c: Cat) => destaques.includes(slugDe(c)) || destaques.includes(c.nome) || destaques.includes(c.nome_publico)

  async function gravarDestaques(lista: string[]) {
    // Regrava a lista inteira (poucas linhas): apaga e insere na ordem escolhida
    const { error: ed } = await erp.from('loja_menu_destaques').delete().neq('slug', '')
    const { error: ei } = ed || !lista.length ? { error: null } : await erp.from('loja_menu_destaques').insert(lista.map((slug, ordem) => ({ slug, ordem })))
    const error = ed ?? ei
    setMsg(error ? 'Não foi possível salvar o menu.' : 'Menu salvo.')
    if (!error) { setDestaques(lista); recarregarAjustes() }
  }

  async function alternarDestaque(c: Cat) {
    const slug = slugDe(c)
    const ids = [slug, c.nome, c.nome_publico]
    await gravarDestaques(noTopo(c) ? destaques.filter((x) => !ids.includes(x)) : [...destaques, slug])
  }

  async function salvar(c: Cat, campos: Partial<Pick<Cat, 'nome_publico' | 'imagem' | 'ordem'>>) {
    const novo = { ...c, ...campos }
    const { error } = await erp.from('loja_categorias').upsert({
      categoria_id: c.id,
      nome_publico: novo.nome_publico.trim() || null,
      imagem: novo.imagem,
      ordem: novo.ordem,
    })
    setMsg(error ? 'Não foi possível salvar.' : 'Salvo.')
    carregar()
  }

  async function subirFoto(c: Cat, arquivo: File | undefined) {
    if (!arquivo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) return setMsg('Use JPG, PNG ou WebP.')
    if (arquivo.size > 5 * 1024 * 1024) return setMsg('Imagem acima de 5 MB.')
    const ext = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg'
    const caminho = `categorias/${c.id}/${Date.now()}.${ext}`
    const { error } = await erp.storage.from('loja-produtos').upload(caminho, arquivo, { contentType: arquivo.type })
    if (error) return setMsg('Falha ao enviar a foto.')
    salvar(c, { imagem: erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl })
  }

  const visiveis = cats.filter((c) => todas || c.publicados > 0)
  const ocultas = cats.length - cats.filter((c) => c.publicados > 0).length

  return (
    <div>
      <p className="dica">
        As categorias vêm do ERP. Aqui você escolhe o nome que o cliente vê, a foto e a ordem no menu. Marque <strong>No topo</strong> nas que devem aparecer ao lado de “Todos os produtos” (as demais ficam dentro dele). Sem nenhuma marcada, o topo mostra as primeiras.
        {msg && <strong> {msg}</strong>}
      </p>
      <label className="radio dica">
        <input type="checkbox" checked={todas} onChange={(e) => setTodas(e.target.checked)} /> Mostrar também as {ocultas} sem produto no site
      </label>
      <ul className="lista-admin">
        {visiveis.map((c) => (
          <CategoriaLinha key={c.id} c={c} aoSalvar={salvar} aoFoto={subirFoto} noTopo={noTopo(c)} aoAlternar={() => alternarDestaque(c)} />
        ))}
        {visiveis.length === 0 && <li className="dica">Nenhuma categoria com produto no site ainda.</li>}
      </ul>
    </div>
  )
}

function CategoriaLinha({ c, aoSalvar, aoFoto, noTopo, aoAlternar }: {
  noTopo: boolean
  aoAlternar: () => void
  c: Cat
  aoSalvar: (c: Cat, campos: Partial<Pick<Cat, 'nome_publico' | 'imagem' | 'ordem'>>) => void
  aoFoto: (c: Cat, f: File | undefined) => void
}) {
  const arq = useRef<HTMLInputElement>(null)
  const [nome, setNome] = useState(c.nome_publico)
  const [ordem, setOrdem] = useState(String(c.ordem))
  return (
    <li className="cat-linha">
      {c.imagem ? <img src={c.imagem} alt="" className="cat-thumb" /> : <span className="cat-thumb cat-thumb-vazio" />}
      <span className="cat-erp" title="Nome no ERP">{c.nome}{c.publicados > 0 && <small> ({c.publicados})</small>}</span>
      <input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={() => nome !== c.nome_publico && aoSalvar(c, { nome_publico: nome })} placeholder="Nome no site" aria-label={`Nome no site de ${c.nome}`} />
      <input className="cat-ordem" inputMode="numeric" value={ordem} onChange={(e) => setOrdem(e.target.value)} onBlur={() => Number(ordem) !== c.ordem && aoSalvar(c, { ordem: Number(ordem) || 0 })} title="Ordem no menu" aria-label="Ordem" />
      <label className="radio cat-topo" title="Mostrar no menu do topo, ao lado de Todos os produtos"><input type="checkbox" checked={noTopo} onChange={aoAlternar} /> No topo</label>
      <button className="link-botao" onClick={() => arq.current?.click()}>{c.imagem ? 'Trocar foto' : 'Foto'}</button>
      {c.imagem && <button className="link-botao" onClick={() => aoSalvar(c, { imagem: null })}>×</button>}
      <input ref={arq} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { aoFoto(c, e.target.files?.[0]); e.target.value = '' }} />
    </li>
  )
}
