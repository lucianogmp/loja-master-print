import { useCallback, useEffect, useLayoutEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { erp } from '../lib/erp'
import { brl } from '../lib/format'
import { percentualDesconto, precoComPromocao, type Promocao } from '../lib/promocao'
import AutoTextarea from '../components/AutoTextarea'
import ListaOuBlocos, { BotoesVisao, useVisao } from './ListaOuBlocos'
import { enquadrarFoto, enquadrarFotoExistente } from './EnquadrarFoto'
import { useColarFotos } from './colarFotos'

type Item = { id: string; nome: string; categoria: string | null; preco: number | null; lp: LP | null }
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
  promo_tipo: Promocao['tipo'] | null
  promo_valor: number | null
  opcoes_quantidade: { quantidade: number; preco: number; peso_kg?: number | null }[] | null
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
  const [visao, setVisao] = useVisao()

  const carregar = useCallback(async () => {
    const { data: prods } = await erp
      .from('produtos')
      .select('id, nome, preco_venda, por_metro_quadrado, unidade_medida, categorias(nome)')
      .eq('publicar_no_catalogo', true)
      .order('nome')
    const { data: lps } = await erp.from('loja_produtos').select('*')
    const porId = new Map((lps ?? []).map((l: LP & { produto_id: string }) => [l.produto_id, l]))
    setItens(
      (prods ?? []).map((p: { id: string; nome: string; preco_venda: number | null; por_metro_quadrado: boolean | null; unidade_medida: string | null; categorias: { nome: string } | { nome: string }[] | null }) => ({
        id: p.id,
        nome: p.nome,
        // Só produto com preço fixo (não por m²) mostra preço — e promoção — no site
        preco: p.por_metro_quadrado || p.unidade_medida === 'm2' || !(Number(p.preco_venda) > 0) ? null : Number(p.preco_venda),
        categoria: Array.isArray(p.categorias) ? p.categorias[0]?.nome ?? null : p.categorias?.nome ?? null,
        lp: (porId.get(p.id) as LP | undefined) ?? null,
      })),
    )
    setCarregando(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  // Editar abre uma tela só do produto; a lista fica guardada e volta ao fechar
  const aberto_ = aberto ? itens.find((x) => x.id === aberto) : undefined
  if (aberto_) {
    return <Editor key={aberto_.id} item={aberto_} aoVoltar={() => setAberto(null)} aoSalvar={() => { carregar(); setAberto(null) }} />
  }

  return (
    <div>
      <p className="dica">
        Aqui aparecem os produtos marcados com "Aparece no site" no ERP. Clique em um produto para editar fotos, descrição, envio e promoção.
      </p>
      {carregando && <p>Carregando...</p>}
      {!carregando && itens.length === 0 && <p className="vazio">Nenhum produto marcado no ERP ainda.</p>}
      <BotoesVisao visao={visao} onChange={setVisao} />
      <ListaOuBlocos
        itens={itens.map((it) => ({
          id: it.id,
          nome: it.nome,
          sub: it.categoria ?? 'sem categoria',
          foto: it.lp?.imagens?.[0],
          avisos: [...(it.lp ? [] : ['sem foto/descrição']), ...(it.lp?.promo_tipo ? ['em promoção'] : [])],
        }))}
        visao={visao}
        aberto={null}
        onAbrir={setAberto}
        editor={() => null}
      />
    </div>
  )
}

function Editor({ item, aoSalvar, aoVoltar }: { item: Item; aoSalvar: () => void; aoVoltar: () => void }) {
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
  const [promoTipo, setPromoTipo] = useState<'' | Promocao['tipo']>(item.lp?.promo_tipo ?? '')
  const [promoValor, setPromoValor] = useState(item.lp?.promo_valor != null ? String(item.lp.promo_valor).replace('.', ',') : '')
  // Quantidades fechadas (250, 500, 1000...), cada uma com preço próprio. Texto livre até salvar (aceita vírgula).
  const [opcoes, setOpcoes] = useState<{ q: string; preco: string; peso: string }[]>(
    (item.lp?.opcoes_quantidade ?? []).map((o) => ({
      q: String(o.quantidade),
      preco: String(o.preco).replace('.', ','),
      peso: o.peso_kg ? String(o.peso_kg).replace('.', ',') : '',
    })),
  )
  const setOpcao = (i: number, campo: 'q' | 'preco' | 'peso', v: string) =>
    setOpcoes((a) => a.map((o, k) => (k === i ? { ...o, [campo]: v } : o)))
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  // A tela do produto sempre abre no topo (a lista pode ter sido rolada até o produto clicado)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  function subir(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])]
    e.target.value = ''
    void processar(arquivos)
  }
  useColarFotos((arq) => { if (!enviando) void processar(arq) })

  async function processar(arquivos: File[]) {
    if (!arquivos.length) return
    setEnviando(true)
    setMsg('')
    const novas: string[] = []
    for (const orig of arquivos) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(orig.type)) { setMsg('Use JPG, PNG ou WebP.'); continue }
      const f = await enquadrarFoto(orig)
      if (!f) continue
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

  async function ajustar(i: number) {
    setMsg('')
    try {
      const f = await enquadrarFotoExistente(imagens[i])
      if (!f) return
      setEnviando(true)
      const caminho = `${item.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
      const { error } = await erp.storage.from('loja-produtos').upload(caminho, f, { contentType: f.type })
      if (error) { setMsg('Falha ao enviar a foto ajustada.'); return }
      const nova = erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl
      setImagens((a) => a.map((u, k) => (k === i ? nova : u)))
    } catch {
      setMsg('Não consegui abrir essa foto para ajustar. Remova e suba de novo.')
    } finally {
      setEnviando(false)
    }
  }
  const principal = (i: number) => setImagens((a) => [a[i], ...a.filter((_, k) => k !== i)])
  const remover = (i: number) => setImagens((a) => a.filter((_, k) => k !== i))

  // Promoção: o "de" é o preço do ERP; aqui só se define o "por" (em % ou em reais)
  const valorPromo = num(promoValor)
  const promo: Promocao | null = promoTipo && valorPromo ? { tipo: promoTipo, valor: valorPromo } : null
  const por = item.preco !== null ? precoComPromocao(item.preco, promo) : null
  const promoValida = item.preco !== null && por !== null && por < item.preco
  const textoErroPromo =
    !promoTipo || item.preco === null
      ? ''
      : !valorPromo
        ? 'Informe o valor da promoção.'
        : promoTipo === 'percentual' && valorPromo >= 100
          ? 'O desconto precisa ser menor que 100%.'
          : promoTipo === 'preco' && valorPromo >= item.preco
            ? `O preço promocional precisa ser menor que ${brl(item.preco)}.`
            : ''

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const s = slugify(slug)
    if (modo === 'envio_e_retirada' && [peso, comp, larg, alt].some((v) => v.trim() !== '') && [peso, comp, larg, alt].some((v) => num(v) === null)) {
      return setMsg('Preencha peso e as 3 medidas do pacote (ou deixe todos vazios).')
    }
    if (!s) return setMsg('Endereço (slug) inválido.')
    if (textoErroPromo) return setMsg(textoErroPromo)
    // Quantidades: ignora linha totalmente vazia; as demais precisam de quantidade inteira e preço
    const linhasOpcoes = opcoes.filter((o) => o.q.trim() || o.preco.trim() || o.peso.trim())
    const opcoesSalvar: { quantidade: number; preco: number; peso_kg: number | null }[] = []
    for (const o of linhasOpcoes) {
      const q = num(o.q)
      const preco = num(o.preco)
      if (q === null || !Number.isInteger(q) || preco === null) return setMsg('Cada quantidade precisa de um número inteiro e de um preço.')
      if (o.peso.trim() && num(o.peso) === null) return setMsg('Peso da quantidade inválido (ou deixe vazio).')
      opcoesSalvar.push({ quantidade: q, preco, peso_kg: num(o.peso) })
    }
    if (new Set(opcoesSalvar.map((o) => o.quantidade)).size !== opcoesSalvar.length) return setMsg('Há quantidades repetidas.')
    opcoesSalvar.sort((a, b) => a.quantidade - b.quantidade)
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
      opcoes_quantidade: opcoesSalvar,
      destaque,
      ordem,
      promo_tipo: promoTipo && valorPromo && item.preco !== null ? promoTipo : null,
      promo_valor: promoTipo && valorPromo && item.preco !== null ? valorPromo : null,
    })
    if (error) return setMsg(error.message.includes('duplicate') ? 'Esse endereço já é de outro produto.' : 'Não foi possível salvar.')
    aoSalvar()
  }

  return (
    <form className="ed-produto" onSubmit={salvar}>
      <div className="ed-barra">
        <button type="button" className="link-botao ed-voltar" onClick={aoVoltar}>
          <ArrowLeft size={16} aria-hidden="true" /> Produtos
        </button>
        <div className="ed-titulo">
          <h2>{item.nome}</h2>
          <small>
            {item.categoria ?? 'sem categoria'} · {item.preco !== null ? `${brl(item.preco)} no ERP` : 'sem preço no site (sob consulta)'}
          </small>
        </div>
        <button className="btn btn-primario" disabled={enviando}>Salvar</button>
      </div>

      <div className="ed-grade">
        <section className="ed-card ed-fotos">
          <h3>Fotos</h3>
          <div className="admin-fotos">
            {imagens.map((u, i) => (
              <div key={u} className="admin-foto ed-foto">
                <img src={u} alt="" />
                {i === 0 && <span className="ed-principal">Principal</span>}
                <div>
                  {i > 0 && <button type="button" className="link-botao" onClick={() => principal(i)}>Principal</button>}
                  <button type="button" className="link-botao" onClick={() => ajustar(i)} disabled={enviando}>Ajustar</button>
                  <button type="button" className="link-botao" onClick={() => remover(i)}>Remover</button>
                </div>
              </div>
            ))}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={subir} disabled={enviando} aria-label="Adicionar fotos" />
          <span className="dica">{enviando ? 'Enviando...' : 'JPG, PNG ou WebP, até 5 MB cada. A primeira é a principal. Também dá para colar a imagem (Ctrl+V).'}</span>
        </section>

        <section className="ed-card ed-descricao">
          <h3>Descrição</h3>
          <AutoTextarea id={`d${item.id}`} aria-label="Descrição" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </section>

        <section className="ed-card ed-quantidades">
          <h3>Quantidades</h3>
          <span className="dica">
            Para produtos vendidos em quantidades fechadas (ex.: cartão de visita 250, 500, 1000). O cliente escolhe uma e paga o preço dela.
            Deixe vazio para vender como produto comum.
          </span>
          {opcoes.length > 0 && (
            <div className="ed-opcoes">
              <div className="medidas-linha ed-opcoes-cab" aria-hidden="true">
                <span>Quantidade</span><span>Preço (R$)</span><span>Peso (kg, opcional)</span>
              </div>
              {opcoes.map((o, i) => (
                <div key={i} className="medidas-linha">
                  <input inputMode="numeric" value={o.q} onChange={(e) => setOpcao(i, 'q', e.target.value)} placeholder="500" aria-label={`Quantidade ${i + 1}`} />
                  <input inputMode="decimal" value={o.preco} onChange={(e) => setOpcao(i, 'preco', e.target.value)} placeholder="0,00" aria-label={`Preço da quantidade ${i + 1}`} />
                  <input inputMode="decimal" value={o.peso} onChange={(e) => setOpcao(i, 'peso', e.target.value)} placeholder={peso || '0,4'} aria-label={`Peso da quantidade ${i + 1}`} />
                  <button type="button" className="link-botao" onClick={() => setOpcoes((a) => a.filter((_, k) => k !== i))}>Remover</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <button type="button" className="link-botao" onClick={() => setOpcoes((a) => [...a, { q: '', preco: '', peso: '' }])}>+ Adicionar quantidade</button>
          </div>
          {opcoes.length > 0 && (
            <span className="dica">
              Com quantidades, o preço do ERP não é usado e a promoção do site não vale para este produto. O pedido chega no ERP como
              “{item.nome} — 500 un.” pelo preço da opção. Para frete, o peso da quantidade vale; vazio, usa o peso do produto (em Envio).
            </span>
          )}
        </section>

        <section className="ed-card ed-promocao">
          <h3>Promoção (só no site)</h3>
          {item.preco === null ? (
            <span className="dica">Produto sob consulta ou por m² não mostra preço no site, então não tem promoção.</span>
          ) : (
            <>
              <div className="medidas-linha">
                <label>
                  Tipo
                  <select className="ed-select" value={promoTipo} onChange={(e) => { setPromoTipo(e.target.value as '' | Promocao['tipo']); setPromoValor('') }} aria-label="Tipo de promoção">
                    <option value="">Sem promoção</option>
                    <option value="percentual">Desconto em %</option>
                    <option value="preco">Preço de → por</option>
                  </select>
                </label>
                {promoTipo === 'percentual' && (
                  <label>
                    Desconto <input inputMode="decimal" value={promoValor} onChange={(e) => setPromoValor(e.target.value)} placeholder="10" aria-label="Desconto em porcentagem" /> %
                  </label>
                )}
                {promoTipo === 'preco' && (
                  <label>
                    Por R$ <input inputMode="decimal" value={promoValor} onChange={(e) => setPromoValor(e.target.value)} placeholder="0,00" aria-label="Preço promocional" />
                  </label>
                )}
              </div>
              {promoTipo && promoValida && por !== null && item.preco !== null && (
                <p className="ed-previa">
                  <s>{brl(item.preco)}</s> <strong>{brl(por)}</strong> <span className="badge-promo">-{percentualDesconto(item.preco, por)}%</span>
                </p>
              )}
              {textoErroPromo && <span className="dica" role="note">{textoErroPromo}</span>}
              <span className="dica">
                O preço “de” é o do ERP e não muda. No site aparece riscado, com o preço promocional em destaque. O pedido entra no ERP com o desconto aplicado.
              </span>
            </>
          )}
        </section>

        <section className="ed-card ed-envio">
          <h3>Envio</h3>
          <fieldset className="campo opcoes-arte">
            <legend>Modo de entrega</legend>
            <label className="radio">
              <input type="radio" name={`m${item.id}`} checked={modo === 'envio_e_retirada'} onChange={() => setModo('envio_e_retirada')} />
              Correios e retirada na gráfica
            </label>
            <label className="radio">
              <input type="radio" name={`m${item.id}`} checked={modo === 'so_retirada'} onChange={() => setModo('so_retirada')} />
              Somente retirada na gráfica
            </label>
          </fieldset>
          {modo === 'envio_e_retirada' && (
            <>
              <div className="medidas-linha">
                <label>Peso <input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0,4" aria-label="Peso em kg" /> kg</label>
                <label>Pacote <input inputMode="decimal" value={comp} onChange={(e) => setComp(e.target.value)} placeholder="C" aria-label="Comprimento em cm" />
                  × <input inputMode="decimal" value={larg} onChange={(e) => setLarg(e.target.value)} placeholder="L" aria-label="Largura em cm" />
                  × <input inputMode="decimal" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="A" aria-label="Altura em cm" /> cm</label>
              </div>
              <span className="dica">Pacote já embalado (comprimento × largura × altura). Usado no frete.</span>
              {[peso, comp, larg, alt].every((v) => num(v) !== null && (num(v) ?? 0) > 0) ? (
                <span className="dica">✅ Envio pelos Correios liberado para este produto.</span>
              ) : (
                <span className="dica">⚠️ Sem peso e medidas completos, este produto fica só para retirada quando o frete online estiver ligado.</span>
              )}
            </>
          )}
        </section>

        <section className="ed-card ed-vitrine">
          <h3>Vitrine</h3>
          <div className="medidas-linha">
            <label className="radio"><input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} /> Destaque na página inicial</label>
            <label>Ordem <input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value) || 0)} /></label>
          </div>
          <details>
            <summary className="dica">Avançado: endereço da página (slug)</summary>
            <div className="campo">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Endereço da página" />
              <span className="dica">Gerado do nome. Só mude se precisar.</span>
            </div>
          </details>
        </section>
      </div>

      {msg && <p className="dica" role="alert">{msg}</p>}
    </form>
  )
}
