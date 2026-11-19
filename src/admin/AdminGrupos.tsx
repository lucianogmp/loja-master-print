import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { erp } from '../lib/erp'
import { brl } from '../lib/format'
import AutoTextarea from '../components/AutoTextarea'
import { enquadrarFoto } from './EnquadrarFoto'

// Grupo = vários produtos do ERP que só mudam em impressão (4x0, 4x4...) e/ou quantidade, vendidos numa página só
// com seletores. Nada é criado nem alterado no ERP: cada opção continua sendo o produto real (preço, prazo, produção).

type Prod = { id: string; nome: string; preco_venda: number | null }
type Grupo = {
  id: string; slug: string; nome: string; descricao: string | null; imagens: string[]; destaque: boolean; ordem: number
  visivel: boolean; principal_id: string | null; rotulo_a: string; rotulo_b: string
}
type Linha = { produto_id: string; a: string; b: string; texto?: string } // texto: o que foi digitado na busca do produto (só na tela)

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

// Sugere a quantidade pelo número no fim do nome (ex.: "Cartão de visita 500" → "500 unidades"); dá pra editar
const sugerirQuantidade = (nome: string) => {
  const m = nome.match(/(\d[\d.]*)\s*(un\w*)?\s*$/i)
  return m ? `${m[1]} unidades` : ''
}

export default function AdminGrupos() {
  const [prods, setProds] = useState<Prod[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [itens, setItens] = useState<(Linha & { grupo_id: string })[]>([])
  const [aberto, setAberto] = useState<string | null>(null) // id; 'novo' = criando
  const [msg, setMsg] = useState('')

  const carregar = useCallback(async () => {
    const [p, g, i] = await Promise.all([
      erp.from('produtos').select('id,nome,preco_venda').eq('publicar_no_catalogo', true).eq('status', 'ativo').order('nome'),
      erp.from('loja_grupos').select('*').order('ordem').order('nome'),
      erp.from('loja_grupo_itens').select('grupo_id,produto_id,a,b,ordem').order('ordem'),
    ])
    setProds((p.data as Prod[]) ?? [])
    setGrupos((g.data as Grupo[]) ?? [])
    setItens(((i.data ?? []) as { grupo_id: string; produto_id: string; a: string | null; b: string | null }[]).map((x) => ({ ...x, a: x.a ?? '', b: x.b ?? '' })))
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const atual = aberto && aberto !== 'novo' ? grupos.find((g) => g.id === aberto) : undefined
  if (aberto === 'novo' || atual) {
    const inicial: Grupo = atual ?? {
      id: crypto.randomUUID(), slug: '', nome: '', descricao: '', imagens: [], destaque: false, ordem: 0, visivel: true,
      principal_id: null, rotulo_a: 'Impressão', rotulo_b: 'Quantidade',
    }
    return (
      <Editor
        key={inicial.id}
        existe={!!atual}
        inicial={inicial}
        linhasIniciais={itens.filter((x) => x.grupo_id === inicial.id)}
        prods={prods}
        usadosEmOutros={new Set(itens.filter((x) => x.grupo_id !== inicial.id).map((x) => x.produto_id))}
        aoVoltar={() => setAberto(null)}
        aoSalvar={(t) => { setAberto(null); setMsg(t); carregar() }}
      />
    )
  }

  return (
    <div className="admin-form">
      <p className="dica">
        Junte produtos do ERP que só mudam em <strong>impressão</strong> (4x0, 4x4...) e/ou <strong>quantidade</strong> numa página só: o cliente escolhe
        clicando nos botões. O preço e o prazo vêm de cada produto do ERP e o pedido entra no ERP como o produto escolhido. Nada é criado nem alterado no ERP.
      </p>
      {grupos.length === 0 && <p className="vazio">Nenhum grupo ainda.</p>}
      <ul className="admin-lista-grupos">
        {grupos.map((g) => (
          <li key={g.id}>
            <button type="button" className="link-botao" onClick={() => setAberto(g.id)}>
              <strong>{g.nome}</strong>
            </button>
            <small> · {itens.filter((x) => x.grupo_id === g.id).length} produto(s){g.visivel ? '' : ' · oculto'}</small>
          </li>
        ))}
      </ul>
      <div><button className="btn btn-secundario" onClick={() => setAberto('novo')}>Novo grupo</button></div>
      {msg && <p className="dica" role="status">{msg}</p>}
    </div>
  )
}

function Editor({ inicial, existe, linhasIniciais, prods, usadosEmOutros, aoVoltar, aoSalvar }: {
  inicial: Grupo; existe: boolean; linhasIniciais: Linha[]; prods: Prod[]; usadosEmOutros: Set<string>
  aoVoltar: () => void; aoSalvar: (msg: string) => void
}) {
  const [f, setF] = useState<Grupo>({ ...inicial, descricao: inicial.descricao ?? '' })
  const [linhas, setLinhas] = useState<Linha[]>(linhasIniciais.map((l) => ({ produto_id: l.produto_id, a: l.a, b: l.b, texto: prods.find((p) => p.id === l.produto_id)?.nome ?? '' })))
  const [slugManual, setSlugManual] = useState(existe)
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = <K extends keyof Grupo>(k: K, v: Grupo[K]) => setF((x) => ({ ...x, [k]: v }))
  const setLinha = (i: number, campo: keyof Linha, v: string) => setLinhas((a) => a.map((l, k) => (k === i ? { ...l, [campo]: v } : l)))
  const nomeDe = (id: string) => prods.find((p) => p.id === id)?.nome ?? ''
  const livres = (daLinha: string) => prods.filter((p) => !usadosEmOutros.has(p.id) && (p.id === daLinha || !linhas.some((l) => l.produto_id === p.id)))

  // Busca digitando: o navegador filtra a lista pelo que foi escrito; ao bater com um produto, ele é escolhido
  function digitarProduto(i: number, texto: string) {
    const achado = livres(linhas[i]?.produto_id ?? '').find((p) => p.nome === texto)
    setLinhas((a) => a.map((l, k) => (k === i
      ? { ...l, texto, produto_id: achado?.id ?? '', b: achado ? l.b || sugerirQuantidade(achado.nome) : l.b }
      : l)))
  }

  async function subir(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!arquivos.length) return
    setEnviando(true)
    setMsg('')
    const novas: string[] = []
    for (const orig of arquivos) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(orig.type)) { setMsg('Use JPG, PNG ou WebP.'); continue }
      const arq = await enquadrarFoto(orig)
      if (!arq) continue
      if (arq.size > 5 * 1024 * 1024) { setMsg('Imagem acima de 5 MB foi ignorada.'); continue }
      const ext = arq.type === 'image/png' ? 'png' : arq.type === 'image/webp' ? 'webp' : 'jpg'
      const caminho = `grupos/${f.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await erp.storage.from('loja-produtos').upload(caminho, arq, { contentType: arq.type })
      if (error) { setMsg('Falha ao enviar uma imagem.'); continue }
      novas.push(erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl)
    }
    set('imagens', [...f.imagens, ...novas])
    setEnviando(false)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    const nome = f.nome.trim()
    const slug = slugify(f.slug || nome)
    if (linhas.some((l) => l.texto?.trim() && !l.produto_id)) return setMsg('Há um produto digitado que não foi encontrado. Escolha um da lista que aparece ao digitar.')
    const validas = linhas.filter((l) => l.produto_id)
    if (!nome) return setMsg('Dê um nome ao grupo.')
    if (!slug) return setMsg('Endereço (slug) inválido.')
    if (validas.length === 0) return setMsg('Escolha pelo menos um produto.')
    if (new Set(validas.map((l) => `${l.a.trim().toLowerCase()}|${l.b.trim().toLowerCase()}`)).size !== validas.length) {
      return setMsg('Há duas opções iguais (mesma impressão e mesma quantidade). Ajuste os textos.')
    }
    const principal = validas.some((l) => l.produto_id === f.principal_id) ? f.principal_id : validas[0].produto_id
    setEnviando(true)
    const { error } = await erp.from('loja_grupos').upsert({
      id: f.id, slug, nome, descricao: f.descricao?.trim() || null, imagens: f.imagens, destaque: f.destaque, ordem: f.ordem,
      visivel: f.visivel, principal_id: principal, rotulo_a: f.rotulo_a.trim() || 'Impressão', rotulo_b: f.rotulo_b.trim() || 'Quantidade',
    })
    if (error) {
      setEnviando(false)
      return setMsg(error.message.includes('duplicate') ? 'Esse endereço já é de outro grupo.' : 'Não foi possível salvar o grupo.')
    }
    await erp.from('loja_grupo_itens').delete().eq('grupo_id', f.id)
    const { error: ei } = await erp.from('loja_grupo_itens').insert(
      validas.map((l, i) => ({ grupo_id: f.id, produto_id: l.produto_id, a: l.a.trim() || null, b: l.b.trim() || null, ordem: i })),
    )
    setEnviando(false)
    if (ei) return setMsg('O grupo foi salvo, mas não foi possível salvar os produtos (algum já está em outro grupo?).')
    aoSalvar('Grupo salvo.')
  }

  async function excluir() {
    if (!window.confirm(`Excluir o grupo "${f.nome}"? Os produtos voltam a aparecer separados no site.`)) return
    const { error } = await erp.from('loja_grupos').delete().eq('id', f.id)
    if (error) return setMsg('Não foi possível excluir.')
    aoSalvar('Grupo excluído.')
  }

  const principalId = linhas.some((l) => l.produto_id === f.principal_id) ? f.principal_id : (linhas.find((l) => l.produto_id)?.produto_id ?? '')

  return (
    <form className="ed-produto" onSubmit={salvar}>
      <div className="ed-barra">
        <button type="button" className="link-botao ed-voltar" onClick={aoVoltar}><ArrowLeft size={16} aria-hidden="true" /> Grupos</button>
        <div className="ed-titulo"><h2>{f.nome || 'Novo grupo'}</h2></div>
        <button className="btn btn-primario" disabled={enviando}>Salvar</button>
      </div>

      <div className="ed-grade">
        <section className="ed-card">
          <h3>Grupo</h3>
          <div className="campo">
            <label htmlFor="g-nome">Nome na loja</label>
            <input id="g-nome" value={f.nome} onChange={(e) => { set('nome', e.target.value); if (!slugManual) set('slug', slugify(e.target.value)) }} placeholder="Cartão de visita" />
          </div>
          <div className="medidas-linha">
            <label>Seletor 1 <input className="g-rotulo" value={f.rotulo_a} onChange={(e) => set('rotulo_a', e.target.value)} aria-label="Nome do primeiro seletor" /></label>
            <label>Seletor 2 <input className="g-rotulo" value={f.rotulo_b} onChange={(e) => set('rotulo_b', e.target.value)} aria-label="Nome do segundo seletor" /></label>
          </div>
          <span className="dica">Deixe a coluna vazia em todos os produtos para esconder aquele seletor (ex.: só quantidade).</span>
          <div className="medidas-linha">
            <label className="radio"><input type="checkbox" checked={f.visivel} onChange={(e) => set('visivel', e.target.checked)} /> Visível na loja</label>
            <label className="radio"><input type="checkbox" checked={f.destaque} onChange={(e) => set('destaque', e.target.checked)} /> Destaque na página inicial</label>
            <label>Ordem <input type="number" value={f.ordem} onChange={(e) => set('ordem', Number(e.target.value) || 0)} /></label>
          </div>
          <details>
            <summary className="dica">Avançado: endereço da página (slug)</summary>
            <div className="campo">
              <input value={f.slug} onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }} aria-label="Endereço da página" />
            </div>
          </details>
        </section>

        <section className="ed-card">
          <h3>Fotos e descrição</h3>
          <div className="admin-fotos">
            {f.imagens.map((u, i) => (
              <div key={u} className="admin-foto ed-foto">
                <img src={u} alt="" />
                {i === 0 && <span className="ed-principal">Principal</span>}
                <div>
                  {i > 0 && <button type="button" className="link-botao" onClick={() => set('imagens', [u, ...f.imagens.filter((x) => x !== u)])}>Principal</button>}
                  <button type="button" className="link-botao" onClick={() => set('imagens', f.imagens.filter((x) => x !== u))}>Remover</button>
                </div>
              </div>
            ))}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={subir} disabled={enviando} aria-label="Adicionar fotos" />
          <span className="dica">Sem fotos aqui, usa as do produto principal.</span>
          <AutoTextarea aria-label="Descrição" rows={3} value={f.descricao ?? ''} onChange={(e) => set('descricao', e.target.value)} placeholder="Vazio = usa a descrição do produto principal" />
        </section>

        <section className="ed-card ed-quantidades">
          <h3>Produtos do grupo</h3>
          <span className="dica">Escolha os produtos do ERP e escreva como cada um aparece nos botões (ex.: 4x0 e 500 unidades). Preço, prazo e envio vêm de cada produto.</span>
          <div className="ed-opcoes">
            {linhas.length > 0 && (
              <div className="g-linha ed-opcoes-cab" aria-hidden="true">
                <span>Produto do ERP</span><span>{f.rotulo_a || 'Seletor 1'}</span><span>{f.rotulo_b || 'Seletor 2'}</span><span>Preço</span><span />
              </div>
            )}
            {linhas.map((l, i) => (
              <div key={i} className="g-linha">
                <input list={`g-prods-${i}`} value={l.texto ?? ''} onChange={(e) => digitarProduto(i, e.target.value)}
                  placeholder="Digite o nome do produto..." aria-label={`Produto ${i + 1}`} aria-invalid={!!l.texto && !l.produto_id} autoComplete="off" />
                <datalist id={`g-prods-${i}`}>
                  {livres(l.produto_id).map((p) => <option key={p.id} value={p.nome} />)}
                </datalist>
                <input value={l.a} onChange={(e) => setLinha(i, 'a', e.target.value)} placeholder="4x0" aria-label={`${f.rotulo_a} do produto ${i + 1}`} />
                <input value={l.b} onChange={(e) => setLinha(i, 'b', e.target.value)} placeholder="500 unidades" aria-label={`${f.rotulo_b} do produto ${i + 1}`} />
                <span className="dica">{(() => { const p = prods.find((x) => x.id === l.produto_id); return p?.preco_venda ? brl(Number(p.preco_venda)) : '—' })()}</span>
                <button type="button" className="link-botao" onClick={() => setLinhas((a) => a.filter((_, k) => k !== i))}>Remover</button>
              </div>
            ))}
          </div>
          <div><button type="button" className="link-botao" onClick={() => setLinhas((a) => [...a, { produto_id: '', a: '', b: '', texto: '' }])}>+ Adicionar produto</button></div>
          {linhas.filter((l) => l.produto_id).length > 1 && (
            <label className="medidas-linha">
              Produto principal (foto, descrição e categoria quando o grupo não tiver)
              <select className="ed-select" value={principalId ?? ''} onChange={(e) => set('principal_id', e.target.value)} aria-label="Produto principal">
                {linhas.filter((l) => l.produto_id).map((l) => <option key={l.produto_id} value={l.produto_id}>{nomeDe(l.produto_id)}</option>)}
              </select>
            </label>
          )}
        </section>
      </div>

      {msg && <p className="dica" role="alert">{msg}</p>}
      {existe && <div><button type="button" className="link-botao" onClick={excluir}>Excluir grupo</button></div>}
    </form>
  )
}
