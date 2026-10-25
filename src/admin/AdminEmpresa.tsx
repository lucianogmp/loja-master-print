import { useEffect, useState, type FormEvent } from 'react'
import { erp } from '../lib/erp'
import { normalizarEmpresa, useSite, type Empresa } from '../lib/site'

export default function AdminEmpresa() {
  const { empresa: salva, recarregar } = useSite()
  const [f, setF] = useState<Empresa>(salva)
  const [msg, setMsg] = useState('')

  useEffect(() => setF(salva), [salva])
  const set = <K extends keyof Empresa>(k: K, v: Empresa[K]) => setF((x) => ({ ...x, [k]: v }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const limpo = normalizarEmpresa({ ...f, whatsapp: f.whatsapp.replace(/\D/g, '') })
    if (limpo.whatsapp.length < 12) return setMsg('WhatsApp: use DDI + DDD + número, só números (ex.: 5533998139539).')
    const { error } = await erp
      .from('loja_config')
      .upsert({ chave: 'empresa', valor: limpo, atualizado_em: new Date().toISOString() })
    if (error) return setMsg('Não foi possível salvar.')
    await recarregar()
    setMsg('Salvo. O site já está atualizado.')
  }

  const campo = (k: keyof Empresa, rotulo: string, dica?: string) => (
    <div className="campo">
      <label htmlFor={`e-${k}`}>{rotulo}</label>
      <input id={`e-${k}`} value={f[k]} onChange={(e) => set(k, e.target.value)} />
      {dica && <span className="dica">{dica}</span>}
    </div>
  )

  return (
    <form className="admin-form" onSubmit={salvar}>
      <h2 className="admin-sub">Identificação</h2>
      <div className="admin-linha">
        {campo('nome', 'Nome da loja')}
        {campo('slogan', 'Frase abaixo do nome')}
      </div>
      <h2 className="admin-sub">Atendimento</h2>
      <div className="admin-linha">
        {campo('whatsapp', 'WhatsApp', 'DDI + DDD + número, só números.')}
        {campo('horario', 'Horário de atendimento')}
      </div>
      {campo('mensagemWhatsApp', 'Mensagem inicial do WhatsApp', 'Texto que já vem escrito quando o cliente clica nos botões de WhatsApp.')}
      <h2 className="admin-sub">Rodapé e contato</h2>
      {campo('textoRodape', 'Texto do rodapé')}
      <div className="admin-linha">
        {campo('email', 'E-mail')}
        {campo('endereco', 'Endereço')}
      </div>
      <div className="admin-linha">
        {campo('instagram', 'Instagram (link completo)')}
        {campo('facebook', 'Facebook (link completo)')}
      </div>
      {msg && <p className="dica" role="alert">{msg}</p>}
      <div>
        <button className="btn btn-primario">Salvar</button>
      </div>
    </form>
  )
}
