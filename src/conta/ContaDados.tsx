import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { mascaraTelefone, so } from '../lib/enderecos'

export default function ContaDados() {
  const { session } = useAuth()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!session) return
    supabase.from('perfis').select('nome, telefone').eq('id', session.user.id).single().then(({ data }) => {
      const m = session.user.user_metadata as { nome?: string; telefone?: string }
      setNome(data?.nome ?? m?.nome ?? '')
      setTelefone(data?.telefone ?? m?.telefone ?? '')
    })
  }, [session])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    if (nome.trim().length < 2) return setMsg('Informe seu nome.')
    if (so(telefone).length < 10) return setMsg('Informe o WhatsApp com DDD.')
    const tel = so(telefone)
    const { error } = await supabase.from('perfis').upsert({ id: session!.user.id, nome: nome.trim(), telefone: tel })
    // O pedido usa o nome e o telefone do login, então eles também são atualizados lá
    const { error: e2 } = await supabase.auth.updateUser({ data: { nome: nome.trim(), telefone: tel } })
    setMsg(error || e2 ? 'Não foi possível salvar.' : 'Dados salvos.')
  }

  const criada = session ? new Date(session.user.created_at).toLocaleDateString('pt-BR') : ''

  return (
    <form className="conta-bloco" onSubmit={salvar}>
      <h2>Meus dados</h2>
      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="c-nome">Nome</label>
          <input id="c-nome" required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="campo campo-medio">
          <label htmlFor="c-tel">WhatsApp</label>
          <input id="c-tel" required inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={mascaraTelefone(telefone)} onChange={(e) => setTelefone(e.target.value)} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="c-email">E-mail</label>
        <input id="c-email" value={session?.user.email ?? ''} readOnly disabled />
        <span className="dica">Para trocar o e-mail da conta, fale com a gente pelo WhatsApp.</span>
      </div>
      <p className="dica">Conta criada em {criada}.</p>
      {msg && <p className="dica" role="status">{msg}</p>}
      <div>
        <button className="btn btn-primario">Salvar</button>
      </div>
    </form>
  )
}
