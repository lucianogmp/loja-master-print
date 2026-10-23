import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { erp } from '../lib/erp'

type Grupo = { id: string; nome: string; slug: string; ordem: number }
type Cat = { id: string; nome: string }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function AdminGrupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [mapa, setMapa] = useState<Record<string, string>>({})
  const [novo, setNovo] = useState('')
  const [msg, setMsg] = useState('')

  const carregar = useCallback(async () => {
    const [g, c, gc] = await Promise.all([
      erp.from('loja_grupos').select('id,nome,slug,ordem').order('ordem').order('nome'),
      erp.from('categorias').select('id,nome').order('nome'),
      erp.from('loja_grupo_categoria').select('categoria_id,grupo_id'),
    ])
    setGrupos((g.data ?? []) as Grupo[])
    setCats((c.data ?? []) as Cat[])
    setMapa(Object.fromEntries((gc.data ?? []).map((r: { categoria_id: string; grupo_id: string }) => [r.categoria_id, r.grupo_id])))
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function criar(e: FormEvent) {
    e.preventDefault()
    const nome = novo.trim()
    if (!nome) return
    const { error } = await erp.from('loja_grupos').insert({ nome, slug: slugify(nome), ordem: grupos.length })
    setMsg(error ? 'Não foi possível criar (nome repetido?).' : 'Grupo criado.')
    setNovo('')
    carregar()
  }

  async function renomear(g: Grupo, nome: string) {
    if (!nome.trim() || nome === g.nome) return
    const { error } = await erp.from('loja_grupos').update({ nome: nome.trim() }).eq('id', g.id)
    setMsg(error ? 'Não foi possível renomear.' : 'Salvo.')
    carregar()
  }

  async function mover(g: Grupo, delta: number) {
    const { error } = await erp.from('loja_grupos').update({ ordem: g.ordem + delta }).eq('id', g.id)
    setMsg(error ? 'Não foi possível reordenar.' : '')
    carregar()
  }

  async function apagar(g: Grupo) {
    if (!confirm(`Apagar o grupo "${g.nome}"? As categorias dele voltam a aparecer sozinhas no menu.`)) return
    await erp.from('loja_grupos').delete().eq('id', g.id)
    carregar()
  }

  async function atribuir(catId: string, grupoId: string) {
    const { error } = grupoId
      ? await erp.from('loja_grupo_categoria').upsert({ categoria_id: catId, grupo_id: grupoId })
      : await erp.from('loja_grupo_categoria').delete().eq('categoria_id', catId)
    setMsg(error ? 'Não foi possível salvar.' : 'Salvo.')
    carregar()
  }

  return (
    <div>
      <p className="dica">
        O menu do site mostra estes grupos. Categoria sem grupo aparece sozinha no menu (se tiver produto no site).
        A ordem usa os números; use as setas para mudar.
      </p>
      {msg && <p className="dica" role="status">{msg}</p>}

      <form className="campo-linha" onSubmit={criar}>
        <div className="campo">
          <label htmlFor="ng">Novo grupo</label>
          <input id="ng" value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="ex.: Adesivos" />
        </div>
        <button className="btn btn-primario">Criar grupo</button>
      </form>

      <h2>Grupos</h2>
      <ul className="lista-admin">
        {grupos.map((g) => (
          <li key={g.id}>
            <input defaultValue={g.nome} onBlur={(e) => renomear(g, e.target.value)} aria-label="Nome do grupo" />
            <button className="link-botao" onClick={() => mover(g, -1)} aria-label="Subir">↑</button>
            <button className="link-botao" onClick={() => mover(g, 1)} aria-label="Descer">↓</button>
            <button className="link-botao" onClick={() => apagar(g)}>Apagar</button>
          </li>
        ))}
        {grupos.length === 0 && <li className="dica">Nenhum grupo ainda.</li>}
      </ul>

      <h2>Categoria do ERP → grupo</h2>
      <ul className="lista-admin">
        {cats.map((c) => (
          <li key={c.id}>
            <span>{c.nome}</span>
            <select value={mapa[c.id] ?? ''} onChange={(e) => atribuir(c.id, e.target.value)} aria-label={`Grupo de ${c.nome}`}>
              <option value="">(sem grupo)</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}
