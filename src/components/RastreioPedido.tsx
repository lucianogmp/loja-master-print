import { useEffect, useState } from 'react'
import { ERP_URL } from '../lib/erp'
import { useAuth } from '../lib/auth'

type Evento = { data: string; descricao: string; local: string; destino: string; detalhe: string }
type Dados = { codigo: string | null; eventos?: Evento[]; entregue?: boolean; previsto?: string | null; indisponivel?: boolean }

const quando = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** Linha do tempo do rastreio dos Correios (o código é digitado pela gráfica no pedido). Sem código, não mostra nada. */
export default function RastreioPedido({ numero }: { numero: number }) {
  const { session } = useAuth()
  const token = session?.access_token
  const [dados, setDados] = useState<Dados | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!token) return
    let vivo = true
    fetch(`${ERP_URL}/functions/v1/loja-rastreio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-comprador-token': token },
      body: JSON.stringify({ numero }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j && typeof j === 'object') setDados(j as Dados) })
      .catch(() => {})
    return () => { vivo = false }
  }, [token, numero])

  if (!dados?.codigo) return null
  const eventos = dados.eventos ?? []

  async function copiar() {
    try { await navigator.clipboard.writeText(dados!.codigo!); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* sem permissão */ }
  }

  return (
    <section className="conta-bloco vidro pedido-bloco rastreio" aria-label="Rastreio do pedido">
      <h2>Rastreio {dados.entregue ? '— entregue' : ''}</h2>
      <p className="recebimento">
        <span className="dica">Código dos Correios</span>
        <strong>{dados.codigo}</strong>
        <button type="button" className="link-botao" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar'}</button>
      </p>
      {dados.previsto && !dados.entregue && <p className="dica">Previsão de entrega: {new Date(dados.previsto).toLocaleDateString('pt-BR')}</p>}
      {eventos.length > 0 ? (
        <ol className="rastreio-eventos">
          {eventos.map((e, i) => (
            <li key={i} className={i === 0 ? 'atual' : ''}>
              <strong>{e.descricao}</strong>
              <small>
                {quando(e.data)}
                {e.local ? ` · ${e.local}` : ''}
                {e.destino ? ` → ${e.destino}` : ''}
              </small>
              {e.detalhe && <small>{e.detalhe}</small>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="dica">
          {dados.indisponivel
            ? 'Não conseguimos consultar o andamento agora. Tente de novo em instantes ou rastreie pelo site dos Correios com o código acima.'
            : 'O objeto foi postado e as primeiras atualizações dos Correios podem levar algumas horas para aparecer.'}
        </p>
      )}
      <a className="link-botao" href="https://rastreamento.correios.com.br/app/index.php" target="_blank" rel="noreferrer">Abrir no site dos Correios</a>
    </section>
  )
}
