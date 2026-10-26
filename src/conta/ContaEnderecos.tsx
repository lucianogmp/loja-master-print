import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { ENDERECO_VAZIO, paraLinha, textoEndereco, useEnderecos, validarEndereco, type Endereco, type EnderecoCampos as Campos } from '../lib/enderecos'
import EnderecoCampos from '../components/EnderecoCampos'

export default function ContaEnderecos() {
  const { session } = useAuth()
  const { lista, carregando, indisponivel, recarregar } = useEnderecos()
  const [editando, setEditando] = useState<string | null>(null) // id, ou '' = novo
  const [form, setForm] = useState<Campos>(ENDERECO_VAZIO)
  const [padrao, setPadrao] = useState(false)
  const [msg, setMsg] = useState('')

  const nomeLogin = (session?.user.user_metadata as { nome?: string; telefone?: string }) ?? {}

  function novo() {
    setForm({ ...ENDERECO_VAZIO, destinatario: nomeLogin.nome ?? '', telefone: nomeLogin.telefone ?? '' })
    setPadrao(lista.length === 0)
    setEditando('')
    setMsg('')
  }
  function editar(e: Endereco) {
    setForm({ ...e })
    setPadrao(e.padrao)
    setEditando(e.id)
    setMsg('')
  }

  async function salvar(ev: FormEvent) {
    ev.preventDefault()
    const problema = validarEndereco(form)
    if (problema) return setMsg(problema)
    const linha = { ...paraLinha(form, session!.user.id), padrao }
    const { error } =
      editando === ''
        ? await supabase.from('enderecos').insert(linha)
        : await supabase.from('enderecos').update(linha).eq('id', editando!)
    if (error) return setMsg(error.message.includes('Limite') ? 'Limite de 5 endereços por conta.' : 'Não foi possível salvar o endereço.')
    setEditando(null)
    setMsg('Endereço salvo.')
    recarregar()
  }

  async function excluir(e: Endereco) {
    if (!confirm('Excluir este endereço?')) return
    const { error } = await supabase.from('enderecos').delete().eq('id', e.id)
    setMsg(error ? 'Não foi possível excluir.' : 'Endereço excluído.')
    recarregar()
  }

  async function tornarPadrao(e: Endereco) {
    await supabase.from('enderecos').update({ padrao: true }).eq('id', e.id)
    recarregar()
  }

  if (carregando) return <p className="dica">Carregando...</p>
  if (indisponivel)
    return (
      <div className="conta-bloco">
        <h2>Meus endereços</h2>
        <p className="dica">Os endereços salvos ainda não estão disponíveis. Você pode informar o endereço na hora de finalizar o pedido.</p>
      </div>
    )

  return (
    <div className="conta-bloco">
      <h2>Meus endereços</h2>
      {lista.length === 0 && editando === null && <p className="dica">Nenhum endereço salvo. Cadastre um para agilizar seus pedidos com entrega.</p>}
      <ul className="lista-admin">
        {lista.map((e) => (
          <li key={e.id} className="admin-item">
            <div className="admin-item-topo">
              <span>
                <strong>{e.destinatario}</strong>
                {e.padrao && <small className="selo-padrao"> · padrão</small>}
                <br />
                <small>{textoEndereco(e)}</small>
              </span>
              <span className="conta-acoes">
                {!e.padrao && <button type="button" className="link-botao" onClick={() => tornarPadrao(e)}>Tornar padrão</button>}
                <button type="button" className="link-botao" onClick={() => editar(e)}>Editar</button>
                <button type="button" className="link-botao" onClick={() => excluir(e)}>Excluir</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {editando !== null ? (
        <form className="conta-bloco" onSubmit={salvar}>
          <h3>{editando === '' ? 'Novo endereço' : 'Editar endereço'}</h3>
          <EnderecoCampos valor={form} onChange={setForm} prefixo="end" />
          <label className="radio">
            <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} /> Usar como endereço padrão
          </label>
          <div className="linha-campos linha-centro">
            <button className="btn btn-primario">Salvar endereço</button>
            <button type="button" className="link-botao" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
        </form>
      ) : (
        lista.length < 5 && (
          <div>
            <button className="btn btn-secundario" onClick={novo}>Adicionar endereço</button>
          </div>
        )
      )}
      {msg && <p className="dica" role="status">{msg}</p>}
    </div>
  )
}
