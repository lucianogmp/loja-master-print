import { useState, type ReactNode } from 'react'
import { LayoutGrid, List } from 'lucide-react'

// Alternância lista/blocos das telas de administração. A escolha fica lembrada neste navegador.
export type Visao = 'lista' | 'blocos'
const CHAVE = 'loja-admin-visao'

export function useVisao(): [Visao, (v: Visao) => void] {
  const [visao, setVisao] = useState<Visao>(() => {
    try {
      return localStorage.getItem(CHAVE) === 'lista' ? 'lista' : 'blocos'
    } catch {
      return 'blocos'
    }
  })
  return [
    visao,
    (v) => {
      setVisao(v)
      try {
        localStorage.setItem(CHAVE, v)
      } catch {
        // sem armazenamento: vale só nesta visita
      }
    },
  ]
}

export type ItemVisao = { id: string; nome: string; sub?: string; foto?: string | null; avisos?: string[] }

export function BotoesVisao({ visao, onChange }: { visao: Visao; onChange: (v: Visao) => void }) {
  return (
    <div className="visao-botoes" role="group" aria-label="Forma de exibição">
      <button type="button" className={visao === 'blocos' ? 'ativo' : ''} onClick={() => onChange('blocos')} aria-pressed={visao === 'blocos'} title="Blocos">
        <LayoutGrid size={16} /> Blocos
      </button>
      <button type="button" className={visao === 'lista' ? 'ativo' : ''} onClick={() => onChange('lista')} aria-pressed={visao === 'lista'} title="Lista">
        <List size={16} /> Lista
      </button>
    </div>
  )
}

export default function ListaOuBlocos({
  itens,
  visao,
  aberto,
  onAbrir,
  editor,
  acoes,
}: {
  itens: ItemVisao[]
  visao: Visao
  aberto: string | null
  onAbrir: (id: string | null) => void
  editor: (id: string) => ReactNode
  acoes?: (id: string) => ReactNode
}) {
  const foto = (i: ItemVisao) =>
    i.foto ? <img className="mini-foto" src={i.foto} alt="" loading="lazy" /> : <span className="mini-foto mini-foto-vazia" aria-hidden="true" />

  if (visao === 'lista') {
    return (
      <ul className="lista-admin">
        {itens.map((i) => (
          <li key={i.id} className="admin-item">
            <div className="admin-item-topo">
              <span className="item-lista-texto">
                {foto(i)}
                <span>
                  <strong>{i.nome}</strong>
                  {i.sub && <small> · {i.sub}</small>}
                  {i.avisos?.map((a) => (
                    <small key={a} className="aviso-admin"> · {a}</small>
                  ))}
                </span>
              </span>
              <span className="conta-acoes">
                {acoes?.(i.id)}
                <button className="btn btn-secundario" onClick={() => onAbrir(aberto === i.id ? null : i.id)}>
                  {aberto === i.id ? 'Fechar' : 'Editar'}
                </button>
              </span>
            </div>
            {aberto === i.id && editor(i.id)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <div className="admin-blocos">
        {itens.map((i) => (
          <div key={i.id} className={`bloco-item${aberto === i.id ? ' ativo' : ''}`}>
            <button type="button" className="bloco-botao" onClick={() => onAbrir(aberto === i.id ? null : i.id)} aria-expanded={aberto === i.id}>
              {foto(i)}
              <strong>{i.nome}</strong>
              {i.sub && <small>{i.sub}</small>}
              {i.avisos?.map((a) => (
                <small key={a} className="aviso-admin">{a}</small>
              ))}
            </button>
            {acoes && <div className="bloco-acoes">{acoes(i.id)}</div>}
          </div>
        ))}
      </div>
      {aberto && itens.some((i) => i.id === aberto) && <div className="bloco-editor">{editor(aberto)}</div>}
    </>
  )
}
