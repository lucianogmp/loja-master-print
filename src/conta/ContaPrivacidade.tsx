import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { buscarPedidos } from '../lib/pedidos'
import { useSite } from '../lib/site'

export default function ContaPrivacidade() {
  const { session } = useAuth()
  const { paginas } = useSite()
  const [confirma, setConfirma] = useState('')
  const [abrir, setAbrir] = useState(false)
  const [msg, setMsg] = useState('')
  const [apagando, setApagando] = useState(false)
  const email = session?.user.email ?? ''

  async function baixar() {
    setMsg('')
    const [perfil, enderecos, pedidos] = await Promise.all([
      supabase.from('perfis').select('*').eq('id', session!.user.id).maybeSingle(),
      supabase.from('enderecos').select('*'),
      buscarPedidos(session!.access_token).catch(() => null),
    ])
    const blob = new Blob(
      [JSON.stringify({ email, perfil: perfil.data, enderecos: enderecos.data ?? [], pedidos }, null, 2)],
      { type: 'application/json' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'meus-dados-master-print.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function excluir() {
    setMsg('')
    setApagando(true)
    const { error } = await supabase.functions.invoke('excluir-conta')
    setApagando(false)
    if (error) return setMsg('Não foi possível excluir a conta agora. Fale com a gente pelo WhatsApp.')
    await supabase.auth.signOut({ scope: 'local' })
    alert('Sua conta foi excluída.')
    window.location.href = '/'
  }

  return (
    <div className="conta-bloco">
      <h2>Meus dados</h2>
      <p className="dica">
        Você pode baixar uma cópia dos seus dados (cadastro, endereços e pedidos) ou excluir sua conta.{' '}
        {paginas.some((p) => p.slug === 'privacidade') && <Link to="/pagina/privacidade">Ler a Política de Privacidade</Link>}
      </p>
      <div>
        <button className="btn btn-secundario" onClick={baixar}>Baixar meus dados</button>
      </div>

      <h2>Excluir minha conta</h2>
      <p className="dica">
        Apaga seu login, seus dados de cadastro e seus endereços. Os pedidos já feitos continuam registrados na gráfica, como
        exigem as obrigações fiscais. Não dá para desfazer.
      </p>
      {!abrir ? (
        <div>
          <button className="btn btn-secundario" onClick={() => setAbrir(true)}>Excluir minha conta</button>
        </div>
      ) : (
        <div className="conta-bloco">
          <div className="campo">
            <label htmlFor="x-conf">Para confirmar, digite seu e-mail</label>
            <input id="x-conf" value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder={email} autoComplete="off" />
          </div>
          <div className="linha-campos linha-centro">
            <button className="btn btn-primario" disabled={apagando || confirma.trim().toLowerCase() !== email.toLowerCase()} onClick={excluir}>
              {apagando ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
            <button className="link-botao" onClick={() => { setAbrir(false); setConfirma('') }}>Cancelar</button>
          </div>
        </div>
      )}
      {msg && <p className="dica" role="alert">{msg}</p>}
    </div>
  )
}
