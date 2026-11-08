import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { erp } from '../lib/erp'
import { useSite } from '../lib/site'
import { useCatalogo } from '../lib/catalogo'
import { useOfertas } from '../lib/ofertas'
import { OPCOES_SEGUNDOS, TIPOS_LINK, destinoDoBanner, type Banner, type Banners, type TipoLink } from '../lib/banners'

const TIPOS_ARQUIVO = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const MAX_MB = 8

const novoId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export default function AdminBanners() {
  const { banners: salvo, recarregar } = useSite()
  const { produtos, categorias } = useCatalogo()
  const { ofertas } = useOfertas()
  const [f, setF] = useState<Banners>(salvo)
  const [msg, setMsg] = useState('')
  const [enviandoId, setEnviandoId] = useState('')

  useEffect(() => setF(salvo), [salvo])

  const mudar = (id: string, parte: Partial<Banner>) =>
    setF((x) => ({ ...x, itens: x.itens.map((b) => (b.id === id ? { ...b, ...parte } : b)) }))

  function mover(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= f.itens.length) return
    const itens = [...f.itens]
    ;[itens[i], itens[j]] = [itens[j], itens[i]]
    setF({ ...f, itens })
  }

  async function subir(id: string, arquivo: File | undefined) {
    if (!arquivo) return
    if (!TIPOS_ARQUIVO.includes(arquivo.type)) return setMsg('Use JPG, PNG, WebP ou GIF (animado vale).')
    if (arquivo.size > MAX_MB * 1024 * 1024) return setMsg(`Imagem acima de ${MAX_MB} MB.`)
    setEnviandoId(id)
    const caminho = `site/banner-${Date.now()}.${EXT[arquivo.type]}`
    const { error } = await erp.storage.from('loja-produtos').upload(caminho, arquivo, { contentType: arquivo.type })
    setEnviandoId('')
    if (error) return setMsg('Falha ao enviar a imagem.')
    mudar(id, { imagem: erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl })
    setMsg('Imagem enviada. Clique em Salvar para publicar.')
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const { error } = await erp.from('loja_config').upsert({ chave: 'banners', valor: f, atualizado_em: new Date().toISOString() })
    if (error) return setMsg('Não foi possível salvar.')
    await recarregar()
    setMsg('Salvo. Os banners já estão atualizados no site.')
  }

  const produtosBase = produtos.filter((p) => !p.derivadoId)

  return (
    <form className="admin-form" onSubmit={salvar}>
      <h2 className="admin-sub">Banners do topo da página inicial</h2>
      <label className="radio">
        <input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} />
        <span>Mostrar os banners no site</span>
      </label>
      <span className="dica">
        Desmarcado, nenhum banner aparece e a página inicial fica como era antes. Os banners ficam guardados.
      </span>
      <div className="campo">
        <label htmlFor="b-seg">Tempo de cada banner</label>
        <select id="b-seg" value={f.segundos} onChange={(e) => setF({ ...f, segundos: Number(e.target.value) })}>
          {OPCOES_SEGUNDOS.map((s) => (
            <option key={s} value={s}>
              {s} segundos
            </option>
          ))}
        </select>
      </div>
      <p className="dica">
        Tamanho da arte: <strong>1600 × 800 px</strong> (proporção 2:1), com o que for importante no centro: no computador as
        bordas de cima e de baixo podem ser cortadas. A mesma imagem serve para celular e computador. JPG, PNG, WebP ou GIF
        animado, até {MAX_MB} MB.
      </p>

      <ul className="lista-admin">
        {f.itens.map((b, i) => (
          <li key={b.id} className="banner-admin">
            <div className="banner-admin-topo">
              {b.imagem ? <img className="banner-admin-thumb" src={b.imagem} alt="" /> : <span className="dica">Sem imagem ainda.</span>}
              <div className="banner-admin-acoes">
                <label className="radio">
                  <input type="checkbox" checked={b.ativo} onChange={(e) => mudar(b.id, { ativo: e.target.checked })} />
                  <span>Ativo</span>
                </label>
                <button type="button" className="icone-btn" aria-label={`Subir banner ${i + 1}`} disabled={i === 0} onClick={() => mover(i, -1)}>
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="icone-btn"
                  aria-label={`Descer banner ${i + 1}`}
                  disabled={i === f.itens.length - 1}
                  onClick={() => mover(i, 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  className="icone-btn"
                  aria-label={`Remover banner ${i + 1}`}
                  onClick={() => setF({ ...f, itens: f.itens.filter((x) => x.id !== b.id) })}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="campo">
              <label htmlFor={`bi-${b.id}`}>Imagem do banner {i + 1}</label>
              <input id={`bi-${b.id}`} type="file" accept={TIPOS_ARQUIVO.join(',')} onChange={(e) => subir(b.id, e.target.files?.[0])} />
              {enviandoId === b.id && <span className="dica">Enviando...</span>}
            </div>
            <div className="campo">
              <label htmlFor={`ba-${b.id}`}>Descrição da imagem (para quem não enxerga a arte)</label>
              <input id={`ba-${b.id}`} value={b.alt} onChange={(e) => mudar(b.id, { alt: e.target.value })} />
            </div>
            <div className="admin-linha">
              <div className="campo">
                <label htmlFor={`bt-${b.id}`}>Ao clicar</label>
                <select id={`bt-${b.id}`} value={b.tipo} onChange={(e) => mudar(b.id, { tipo: e.target.value as TipoLink, destino: '' })}>
                  {TIPOS_LINK.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
              </div>
              {b.tipo === 'produto' && (
                <div className="campo">
                  <label htmlFor={`bd-${b.id}`}>Produto</label>
                  <select id={`bd-${b.id}`} value={b.destino} onChange={(e) => mudar(b.id, { destino: e.target.value })}>
                    <option value="">Escolha...</option>
                    {produtosBase.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {b.tipo === 'categoria' && (
                <div className="campo">
                  <label htmlFor={`bd-${b.id}`}>Categoria</label>
                  <select id={`bd-${b.id}`} value={b.destino} onChange={(e) => mudar(b.id, { destino: e.target.value })}>
                    <option value="">Escolha...</option>
                    {categorias.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {b.tipo === 'oferta' && (
                <div className="campo">
                  <label htmlFor={`bd-${b.id}`}>Oferta</label>
                  <select id={`bd-${b.id}`} value={b.destino} onChange={(e) => mudar(b.id, { destino: e.target.value })}>
                    <option value="">Escolha...</option>
                    {ofertas.map((o) => (
                      <option key={o.id} value={o.slug}>
                        {o.titulo || `Ofertas de ${o.nome}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {b.tipo === 'link' && (
                <div className="campo">
                  <label htmlFor={`bd-${b.id}`}>Endereço (https://... ou /pagina/...)</label>
                  <input id={`bd-${b.id}`} value={b.destino} onChange={(e) => mudar(b.id, { destino: e.target.value })} />
                </div>
              )}
              {b.tipo === 'whatsapp' && (
                <div className="campo">
                  <label htmlFor={`bd-${b.id}`}>Mensagem inicial (vazio = mensagem padrão)</label>
                  <input id={`bd-${b.id}`} value={b.destino} onChange={(e) => mudar(b.id, { destino: e.target.value })} />
                </div>
              )}
            </div>
            {b.tipo !== 'nenhum' && !destinoDoBanner(b) && (
              <span className="dica" role="note">
                Este banner ainda não tem destino válido: por enquanto ele só passa, sem link.
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="admin-linha admin-linha-centro">
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => setF({ ...f, itens: [...f.itens, { id: novoId(), imagem: '', alt: '', ativo: true, tipo: 'nenhum', destino: '' }] })}
        >
          <Plus size={16} aria-hidden="true" /> Adicionar banner
        </button>
      </div>

      {msg && <p className="dica" role="alert">{msg}</p>}
      <div className="admin-linha admin-linha-centro">
        <button className="btn btn-primario">Salvar</button>
      </div>
    </form>
  )
}
