import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { erp } from '../lib/erp'
import { INICIO_PADRAO, useSite, type Inicio } from '../lib/site'
import AutoTextarea from '../components/AutoTextarea'

export default function AdminInicio() {
  const { inicio: salvo, recarregar } = useSite()
  const [f, setF] = useState<Inicio>(salvo)
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Atualiza o formulário quando a configuração termina de carregar
  useEffect(() => setF(salvo), [salvo])

  const set = <K extends keyof Inicio>(k: K, v: Inicio[K]) => setF((x) => ({ ...x, [k]: v }))

  function mover(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= f.secoes.length) return
    const s = [...f.secoes]
    ;[s[i], s[j]] = [s[j], s[i]]
    set('secoes', s)
  }

  async function subirImagem(arquivo: File | undefined) {
    if (!arquivo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) return setMsg('Use JPG, PNG ou WebP.')
    if (arquivo.size > 5 * 1024 * 1024) return setMsg('Imagem acima de 5 MB.')
    setEnviando(true)
    const ext = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg'
    const caminho = `site/inicio-${Date.now()}.${ext}`
    const { error } = await erp.storage.from('loja-produtos').upload(caminho, arquivo, { contentType: arquivo.type })
    setEnviando(false)
    if (error) return setMsg('Falha ao enviar a imagem.')
    set('imagem', erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl)
    setMsg('Imagem enviada. Clique em Salvar para publicar.')
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const { error } = await erp
      .from('loja_config')
      .upsert({ chave: 'inicio', valor: f, atualizado_em: new Date().toISOString() })
    if (error) return setMsg('Não foi possível salvar.')
    await recarregar()
    setMsg('Salvo. A página inicial já está atualizada.')
  }

  return (
    <form className="admin-form" onSubmit={salvar}>
      <h2 className="admin-sub">Destaque (topo da página)</h2>
      <div className="admin-linha">
        <div className="campo">
          <label htmlFor="i-selo">Selo</label>
          <input id="i-selo" value={f.selo} onChange={(e) => set('selo', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="i-bp">Botão principal</label>
          <input id="i-bp" value={f.botaoPrincipal} onChange={(e) => set('botaoPrincipal', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="i-bw">Botão WhatsApp</label>
          <input id="i-bw" value={f.botaoWhatsApp} onChange={(e) => set('botaoWhatsApp', e.target.value)} />
        </div>
      </div>
      <div className="admin-linha">
        <div className="campo">
          <label htmlFor="i-t">Título</label>
          <input id="i-t" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="i-td">Título colorido</label>
          <input id="i-td" value={f.tituloDestaque} onChange={(e) => set('tituloDestaque', e.target.value)} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="i-tx">Texto</label>
        <AutoTextarea id="i-tx" value={f.texto} onChange={(e) => set('texto', e.target.value)} />
      </div>
      <div className="campo">
        <label>Imagem ao lado</label>
        <div className="admin-linha admin-linha-centro">
          {f.imagem ? <img className="admin-hero-thumb" src={f.imagem} alt="" /> : <span className="dica">Usando o desenho padrão.</span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => subirImagem(e.target.files?.[0])} />
          {f.imagem && (
            <button type="button" className="link-botao" onClick={() => set('imagem', '')}>
              Voltar ao desenho padrão
            </button>
          )}
        </div>
        <span className="dica">{enviando ? 'Enviando...' : 'JPG, PNG ou WebP, até 5 MB. Fica melhor em formato quase quadrado ou 4:3.'}</span>
      </div>

      <h2 className="admin-sub">Vantagens (faixa abaixo do destaque)</h2>
      {f.beneficios.map((b, i) => (
        <div key={i} className="admin-linha">
          <input
            aria-label={`Vantagem ${i + 1}, título`}
            value={b.titulo}
            onChange={(e) => set('beneficios', f.beneficios.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
          />
          <input
            aria-label={`Vantagem ${i + 1}, texto`}
            value={b.texto}
            onChange={(e) => set('beneficios', f.beneficios.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
          />
        </div>
      ))}

      <h2 className="admin-sub">Ordem das seções</h2>
      <span className="dica">Use as setas para mudar a ordem. Desmarque para esconder uma seção. O destaque do topo fica sempre primeiro.</span>
      <ul className="lista-admin">
        {f.secoes.map((s, i) => (
          <li key={s.id} className="cat-linha">
            <label className="radio">
              <input
                type="checkbox"
                checked={s.visivel}
                onChange={(e) => set('secoes', f.secoes.map((x, j) => (j === i ? { ...x, visivel: e.target.checked } : x)))}
              />
            </label>
            <input
              aria-label="Título da seção"
              value={s.titulo}
              onChange={(e) => set('secoes', f.secoes.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
            />
            <button type="button" className="icone-btn" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
              <ArrowUp size={16} />
            </button>
            <button type="button" className="icone-btn" aria-label="Descer" disabled={i === f.secoes.length - 1} onClick={() => mover(i, 1)}>
              <ArrowDown size={16} />
            </button>
          </li>
        ))}
      </ul>

      {msg && <p className="dica" role="alert">{msg}</p>}
      <div className="admin-linha admin-linha-centro">
        <button className="btn btn-primario">Salvar</button>
        <button type="button" className="link-botao" onClick={() => setF(INICIO_PADRAO)}>
          Restaurar textos padrão
        </button>
      </div>
    </form>
  )
}
