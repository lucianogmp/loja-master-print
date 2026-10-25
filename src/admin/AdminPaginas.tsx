import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { erp } from '../lib/erp'
import { useSite } from '../lib/site'
import AutoTextarea from '../components/AutoTextarea'

type Pag = { slug: string; titulo: string; conteudo: string; visivel: boolean; no_rodape: boolean; ordem: number }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export default function AdminPaginas() {
  const { recarregar } = useSite()
  const [lista, setLista] = useState<Pag[]>([])
  const [aberto, setAberto] = useState<string | null>(null) // slug aberto, ou '' para nova
  const [msg, setMsg] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await erp.from('loja_paginas').select('*').order('ordem').order('titulo')
    setLista((data as Pag[]) ?? [])
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  async function aposSalvar(texto: string) {
    setMsg(texto)
    await carregar()
    await recarregar()
  }

  return (
    <div className="admin-form">
      <p className="dica">
        Páginas de texto aparecem no rodapé do site (endereço <code>/pagina/nome</code>). Páginas ocultas ficam como rascunho.
      </p>
      <ul className="lista-admin">
        {lista.map((p) => (
          <li key={p.slug} className="admin-item">
            <div className="admin-item-topo">
              <span>
                <strong>{p.titulo}</strong>
                <small className={p.visivel ? '' : 'aviso-admin'}> · {p.visivel ? 'publicada' : 'rascunho (oculta)'}</small>
              </span>
              <button className="btn btn-secundario" onClick={() => setAberto(aberto === p.slug ? null : p.slug)}>
                {aberto === p.slug ? 'Fechar' : 'Editar'}
              </button>
            </div>
            {aberto === p.slug && (
              <Editor
                key={p.slug}
                inicial={p}
                existe
                aoSalvar={aposSalvar}
                aoExcluir={async () => {
                  setAberto(null)
                  await aposSalvar('Página excluída.')
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {aberto === '' ? (
        <Editor
          key="nova"
          inicial={{ slug: '', titulo: '', conteudo: '', visivel: false, no_rodape: true, ordem: (lista.at(-1)?.ordem ?? 0) + 10 }}
          existe={false}
          aoSalvar={async (t) => {
            setAberto(null)
            await aposSalvar(t)
          }}
        />
      ) : (
        <div>
          <button className="btn btn-secundario" onClick={() => setAberto('')}>
            Nova página
          </button>
        </div>
      )}
      {msg && <p className="dica" role="alert">{msg}</p>}
    </div>
  )
}

function Editor({
  inicial,
  existe,
  aoSalvar,
  aoExcluir,
}: {
  inicial: Pag
  existe: boolean
  aoSalvar: (msg: string) => Promise<void>
  aoExcluir?: () => Promise<void>
}) {
  const [f, setF] = useState(inicial)
  const [slugManual, setSlugManual] = useState(false)
  const [erro, setErro] = useState('')
  const area = useRef<HTMLDivElement>(null)
  const set = <K extends keyof Pag>(k: K, v: Pag[K]) => setF((x) => ({ ...x, [k]: v }))

  // Insere a marcação no texto, em volta da seleção ou no cursor
  function inserir(antes: string, depois = '', padrao = '') {
    const ta = area.current?.querySelector('textarea')
    if (!ta) return
    const ini = ta.selectionStart
    const fim = ta.selectionEnd
    const sel = f.conteudo.slice(ini, fim) || padrao
    const novo = f.conteudo.slice(0, ini) + antes + sel + depois + f.conteudo.slice(fim)
    set('conteudo', novo)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(ini + antes.length, ini + antes.length + sel.length)
    })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const slug = existe ? f.slug : f.slug || slugify(f.titulo)
    if (!f.titulo.trim()) return setErro('Dê um título à página.')
    if (!slug || slug !== slugify(slug)) return setErro('Endereço inválido: use só letras minúsculas, números e hífen.')
    const { error } = await erp.from('loja_paginas').upsert({
      slug,
      titulo: f.titulo.trim(),
      conteudo: f.conteudo,
      visivel: f.visivel,
      no_rodape: f.no_rodape,
      ordem: f.ordem,
      atualizado_em: new Date().toISOString(),
    })
    if (error) return setErro('Não foi possível salvar (o endereço pode já existir).')
    await aoSalvar(f.visivel ? 'Salvo e publicado.' : 'Salvo como rascunho (oculta no site).')
  }

  async function excluir() {
    if (!window.confirm(`Excluir a página "${f.titulo}"? Não dá para desfazer.`)) return
    const { error } = await erp.from('loja_paginas').delete().eq('slug', f.slug)
    if (error) return setErro('Não foi possível excluir.')
    await aoExcluir?.()
  }

  return (
    <form className="admin-form" onSubmit={salvar}>
      <div className="admin-linha">
        <div className="campo">
          <label htmlFor={`pt-${inicial.slug}`}>Título</label>
          <input
            id={`pt-${inicial.slug}`}
            value={f.titulo}
            onChange={(e) => {
              set('titulo', e.target.value)
              if (!existe && !slugManual) set('slug', slugify(e.target.value))
            }}
          />
        </div>
        <div className="campo campo-curto">
          <label htmlFor={`po-${inicial.slug}`}>Ordem</label>
          <input id={`po-${inicial.slug}`} type="number" value={f.ordem} onChange={(e) => set('ordem', Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="campo" ref={area}>
        <label>Texto</label>
        <div className="admin-linha admin-barra">
          <button type="button" className="btn btn-secundario" onClick={() => inserir('## ', '', 'Subtítulo')}>Subtítulo</button>
          <button type="button" className="btn btn-secundario" onClick={() => inserir('**', '**', 'negrito')}>Negrito</button>
          <button type="button" className="btn btn-secundario" onClick={() => inserir('- ', '', 'item da lista')}>Lista</button>
          <button type="button" className="btn btn-secundario" onClick={() => inserir('[', '](https://)', 'texto do link')}>Link</button>
        </div>
        <AutoTextarea rows={6} value={f.conteudo} onChange={(e) => set('conteudo', e.target.value)} />
        <span className="dica">Linha em branco separa parágrafos. Subtítulo: <code>## Texto</code> · Lista: <code>- item</code> · Negrito: <code>**texto**</code> · Link: <code>[texto](https://...)</code></span>
      </div>
      <div className="medidas-linha">
        <label className="radio"><input type="checkbox" checked={f.visivel} onChange={(e) => set('visivel', e.target.checked)} /> Publicada (visível no site)</label>
        <label className="radio"><input type="checkbox" checked={f.no_rodape} onChange={(e) => set('no_rodape', e.target.checked)} /> Link no rodapé</label>
      </div>
      {!existe && (
        <details>
          <summary className="dica">Avançado: endereço da página</summary>
          <div className="campo">
            <input
              aria-label="Endereço"
              value={f.slug}
              onChange={(e) => {
                setSlugManual(true)
                set('slug', slugify(e.target.value))
              }}
            />
            <span className="dica">Ficará em /pagina/{f.slug || '...'}. Não dá para mudar depois de criada.</span>
          </div>
        </details>
      )}
      {erro && <p className="dica" role="alert">{erro}</p>}
      <div className="admin-linha admin-linha-centro">
        <button className="btn btn-primario">Salvar</button>
        {existe && (
          <>
            <a className="link-botao" href={`/pagina/${f.slug}`} target="_blank" rel="noreferrer">Ver no site</a>
            <button type="button" className="link-botao" onClick={excluir}>Excluir</button>
          </>
        )}
      </div>
    </form>
  )
}
