import { useEffect, useState, type FormEvent } from 'react'
import { erp } from '../lib/erp'
import { aplicarAparencia, brilho, normalizarAparencia, useSite, type Aparencia } from '../lib/site'

const COR_PADRAO = '#3b82f6'
const SUGESTOES = ['#3b82f6', '#16a34a', '#dc2626', '#ea580c', '#9333ea', '#0d9488', '#db2777', '#ca8a04']

export default function AdminAparencia() {
  const { aparencia: salva, recarregar } = useSite()
  const [f, setF] = useState<Aparencia>(salva)
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState('')

  useEffect(() => setF(salva), [salva])
  const set = <K extends keyof Aparencia>(k: K, v: Aparencia[K]) => setF((x) => ({ ...x, [k]: v }))

  async function subir(campo: 'logo' | 'logoEscuro' | 'favicon', arquivo: File | undefined) {
    if (!arquivo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) return setMsg('Use JPG, PNG ou WebP.')
    if (arquivo.size > 2 * 1024 * 1024) return setMsg('Imagem acima de 2 MB.')
    setEnviando(campo)
    const ext = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg'
    const caminho = `site/${campo}-${Date.now()}.${ext}`
    const { error } = await erp.storage.from('loja-produtos').upload(caminho, arquivo, { contentType: arquivo.type })
    setEnviando('')
    if (error) return setMsg('Falha ao enviar a imagem.')
    set(campo, erp.storage.from('loja-produtos').getPublicUrl(caminho).data.publicUrl)
    setMsg('Imagem enviada. Clique em Salvar para publicar.')
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const limpo = normalizarAparencia(f)
    const { error } = await erp
      .from('loja_config')
      .upsert({ chave: 'aparencia', valor: limpo, atualizado_em: new Date().toISOString() })
    if (error) return setMsg('Não foi possível salvar.')
    await recarregar()
    setMsg('Salvo. O site já está com a nova aparência.')
  }

  // Prévia ao vivo da cor (só nesta tela até salvar)
  function previa(cor: string) {
    set('cor', cor)
    aplicarAparencia(normalizarAparencia({ ...f, cor }))
  }

  const corAtual = f.cor || COR_PADRAO
  const muitoClara = brilho(corAtual) > 0.7

  return (
    <form className="admin-form" onSubmit={salvar}>
      <h2 className="admin-sub">Cor principal</h2>
      <div className="admin-linha admin-linha-centro">
        <input
          type="color"
          aria-label="Cor principal"
          value={corAtual}
          onChange={(e) => previa(e.target.value)}
          className="admin-cor"
        />
        <code>{corAtual}</code>
        {SUGESTOES.map((c) => (
          <button key={c} type="button" className="admin-cor-amostra" style={{ background: c }} aria-label={`Usar ${c}`} onClick={() => previa(c)} />
        ))}
        {f.cor && (
          <button type="button" className="link-botao" onClick={() => previa('')}>
            Voltar ao azul padrão
          </button>
        )}
      </div>
      <span className="dica">Vale para botões, destaques e links, nos temas claro e escuro. Você já vê o resultado ao escolher; só vale para todos os visitantes depois de Salvar.</span>
      {muitoClara && <p className="dica aviso-admin">Essa cor é muito clara: o texto branco dos botões pode ficar difícil de ler.</p>}

      <h2 className="admin-sub">Logo e ícone</h2>
      <p className="dica">
        O logo substitui o nome no topo e ocupa o espaço todo. Envie as duas versões: o site troca sozinho
        conforme o tema (claro ou escuro). Se enviar só uma, ela vale para os dois.
      </p>
      <div className="admin-linha admin-linha-centro">
        <span>Logo para fundo escuro (versão clara)</span>
        {f.logo && <img className="admin-logo-thumb admin-logo-escuro" src={f.logo} alt="" />}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => subir('logo', e.target.files?.[0])} />
        {f.logo && (
          <button type="button" className="link-botao" onClick={() => set('logo', '')}>
            Remover
          </button>
        )}
      </div>
      <div className="admin-linha admin-linha-centro">
        <span>Logo para fundo claro (versão escura)</span>
        {f.logoEscuro && <img className="admin-logo-thumb admin-logo-claro" src={f.logoEscuro} alt="" />}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => subir('logoEscuro', e.target.files?.[0])} />
        {f.logoEscuro && (
          <button type="button" className="link-botao" onClick={() => set('logoEscuro', '')}>
            Remover
          </button>
        )}
      </div>
      <div className="admin-linha admin-linha-centro">
        <span>Ícone da aba</span>
        <img className="admin-logo-thumb" src={f.favicon || '/favicon.svg'} alt="" />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => subir('favicon', e.target.files?.[0])} />
        {f.favicon && (
          <button type="button" className="link-botao" onClick={() => set('favicon', '')}>
            Usar ícone padrão
          </button>
        )}
      </div>
      <span className="dica">
        {enviando ? 'Enviando...' : 'JPG, PNG ou WebP, até 2 MB. Imagem quadrada, com fundo transparente (PNG), funciona melhor.'}
      </span>

      <h2 className="admin-sub">Título da aba do navegador</h2>
      <div className="campo">
        <input aria-label="Título da aba" value={f.tituloAba} onChange={(e) => set('tituloAba', e.target.value)} />
        <span className="dica">O nome da loja e a frase abaixo dele ficam em "Dados da empresa".</span>
      </div>

      {msg && <p className="dica" role="alert">{msg}</p>}
      <div>
        <button className="btn btn-primario">Salvar</button>
      </div>
    </form>
  )
}
