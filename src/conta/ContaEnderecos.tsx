import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { erroDeSessao, useAuth } from '../lib/auth'
import { ENDERECO_VAZIO, paraLinha, textoEndereco, useEnderecos, validarEndereco, type Endereco, type EnderecoCampos as Campos } from '../lib/enderecos'
import EnderecoCampos from '../components/EnderecoCampos'

const LIMITE = 5

export default function ContaEnderecos() {
  const { session, marcarSessaoExpirada } = useAuth()
  const { lista, carregando, indisponivel, recarregar } = useEnderecos()
  const [editando, setEditando] = useState<string | null>(null) // id, ou '' = novo
  const [form, setForm] = useState<Campos>(ENDERECO_VAZIO)
  const [padrao, setPadrao] = useState(false)
  const [msg, setMsg] = useState('')
  const ocupado = useRef(false) // um clique por vez: salvar e excluir não repetem a chamada

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
    if (ocupado.current) return
    const problema = validarEndereco(form)
    if (problema) return setMsg(problema)
    ocupado.current = true
    try {
      const linha = { ...paraLinha(form, session!.user.id), padrao }
      const existente = editando !== ''
      let error: { message: string; status?: number } | null
      if (existente) {
        // `select` devolve as linhas alteradas: nenhuma = o endereço sumiu (excluído em outro aparelho)
        const r = await supabase.from('enderecos').update(linha).eq('id', editando!).select('id')
        error = r.error ?? ((r.data as unknown[] | null)?.length ? null : { message: 'sem linhas' })
      } else {
        error = (await supabase.from('enderecos').insert(linha)).error
      }
      if (erroDeSessao(error)) return void (await marcarSessaoExpirada())
      if (error && existente) {
        setEditando(null)
        recarregar()
        return setMsg('Endereço não encontrado.')
      }
      if (error) return setMsg(error.message.includes('Limite') ? 'Limite de 5 endereços por conta.' : 'Não foi possível salvar o endereço.')
      setEditando(null)
      setMsg('Endereço salvo.')
      recarregar()
    } finally {
      ocupado.current = false
    }
  }

  async function excluir(e: Endereco) {
    if (ocupado.current) return
    if (!confirm('Excluir este endereço?')) return
    ocupado.current = true
    try {
      const { error } = await supabase.from('enderecos').delete().eq('id', e.id)
      if (erroDeSessao(error)) return void (await marcarSessaoExpirada())
      if (error) return setMsg('Não foi possível excluir.')
      // Apagou o padrão: o próximo da lista assume
      const proximo = e.padrao ? lista.find((x) => x.id !== e.id) : undefined
      if (proximo) await supabase.from('enderecos').update({ padrao: true }).eq('id', proximo.id)
      setMsg('Endereço excluído.')
    } finally {
      ocupado.current = false
      recarregar()
    }
  }

  async function tornarPadrao(e: Endereco) {
    await supabase.from('enderecos').update({ padrao: true }).eq('id', e.id)
    recarregar()
  }

  if (carregando) return <p className="dica">Carregando...</p>
  if (indisponivel)
    return (
      <div className="conta-bloco">
        <h1 className="titulo-pagina titulo-sub">Endereços</h1>
        <p className="dica">Os endereços salvos ainda não estão disponíveis. Você pode informar o endereço na hora de finalizar o pedido.</p>
      </div>
    )

  return (
    <div className="conta-bloco">
      <h1 className="titulo-pagina titulo-sub">Endereços</h1>
      {lista.length === 0 && editando === null && <p className="dica">Você ainda não salvou endereços. Cadastre um para agilizar seus pedidos com entrega.</p>}
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
          <h2>{editando === '' ? 'Novo endereço' : 'Editar endereço'}</h2>
          <EnderecoCampos valor={form} onChange={setForm} prefixo="end" />
          <label className="radio">
            <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} /> Usar como endereço padrão
          </label>
          <div className="linha-campos linha-centro">
            <button className="btn btn-primario">Salvar endereço</button>
            <button type="button" className="link-botao" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
        </form>
      ) : lista.length < LIMITE ? (
        <div>
          <button className="btn btn-secundario" onClick={novo}>Adicionar endereço</button>
        </div>
      ) : (
        <p className="dica">Limite de 5 endereços. Exclua um para adicionar outro.</p>
      )}
      {msg && <p className="dica" role="status">{msg}</p>}
    </div>
  )
}
