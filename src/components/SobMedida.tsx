import { useId, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { linkWhatsApp } from '../config'
import { useCatalogo } from '../lib/catalogo'
import { useSite } from '../lib/site'

// Orçamento sob medida: produtos por m² vêm do ERP como "sob consulta" e nunca mostram preço,
// então a loja não calcula nada. Ela só monta o pedido de orçamento com a medida e abre o WhatsApp.

const numero = (v: string) => Number(v.replace(',', '.')) || 0

export function mensagemSobMedida(o: { produto: string; largura: string; altura: string; quantidade: string }) {
  const largura = numero(o.largura)
  const altura = numero(o.altura)
  const qtd = Math.max(1, Math.floor(numero(o.quantidade)) || 1)
  const oque = o.produto.trim() || 'um produto sob medida'
  const medida = largura && altura ? `, medida ${largura} x ${altura} cm` : ''
  return `Olá! Quero um orçamento: ${oque}${medida}, ${qtd} ${qtd === 1 ? 'unidade' : 'unidades'}.`
}

export default function SobMedida() {
  const { empresa } = useSite()
  const { produtos } = useCatalogo()
  const id = useId()
  const sobConsulta = produtos.filter((p) => p.tipoPreco === 'consulta')
  const [produto, setProduto] = useState('')
  const [largura, setLargura] = useState('')
  const [altura, setAltura] = useState('')
  const [quantidade, setQuantidade] = useState('1')

  if (!empresa.whatsapp) return null
  const href = linkWhatsApp(mensagemSobMedida({ produto, largura, altura, quantidade }))

  return (
    <form className="sob-medida" aria-labelledby={`${id}-t`} onSubmit={(e) => e.preventDefault()}>
      <h2 id={`${id}-t`}>Orçamento sob medida</h2>
      <p className="sob-medida-texto">Diga o que precisa e o tamanho. A gráfica responde com o valor e o prazo pelo WhatsApp.</p>
      <div className="campo">
        <label htmlFor={`${id}-p`}>O que você precisa</label>
        {sobConsulta.length > 0 ? (
          <select id={`${id}-p`} value={produto} onChange={(e) => setProduto(e.target.value)}>
            <option value="">Escolha um produto</option>
            {sobConsulta.map((p) => (
              <option key={p.slug} value={p.nome}>
                {p.nome}
              </option>
            ))}
            <option value="Outro produto">Outro produto</option>
          </select>
        ) : (
          <input id={`${id}-p`} value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="ex.: banner em lona" />
        )}
      </div>
      <div className="sob-medida-medidas">
        <div className="campo">
          <label htmlFor={`${id}-l`}>Largura (cm)</label>
          <input id={`${id}-l`} inputMode="decimal" placeholder="100" value={largura} onChange={(e) => setLargura(e.target.value)} />
        </div>
        <span className="sob-medida-x" aria-hidden="true">
          ×
        </span>
        <div className="campo">
          <label htmlFor={`${id}-a`}>Altura (cm)</label>
          <input id={`${id}-a`} inputMode="decimal" placeholder="50" value={altura} onChange={(e) => setAltura(e.target.value)} />
        </div>
        <div className="campo sob-medida-qtd">
          <label htmlFor={`${id}-q`}>Quantidade</label>
          <input id={`${id}-q`} inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
      </div>
      <a className="btn btn-primario btn-bloco" href={href} target="_blank" rel="noreferrer">
        <MessageCircle size={18} aria-hidden="true" />
        Pedir orçamento no WhatsApp
      </a>
    </form>
  )
}
