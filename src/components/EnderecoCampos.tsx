import { useState } from 'react'
import { buscarCep, mascaraCep, mascaraTelefone, so, type EnderecoCampos as Campos } from '../lib/enderecos'

// Campos de endereço compactos. Ao completar o CEP, preenche rua, bairro, cidade e estado sozinho.
export default function EnderecoCampos({
  valor,
  onChange,
  prefixo,
}: {
  valor: Campos
  onChange: (v: Campos) => void
  prefixo: string
}) {
  const [buscando, setBuscando] = useState(false)
  const [avisoCep, setAvisoCep] = useState('')
  const set = (k: keyof Campos, v: string) => onChange({ ...valor, [k]: v })

  async function aoDigitarCep(texto: string) {
    const novo = { ...valor, cep: so(texto).slice(0, 8) }
    onChange(novo)
    setAvisoCep('')
    if (novo.cep.length === 8) {
      setBuscando(true)
      const r = await buscarCep(novo.cep)
      setBuscando(false)
      if (r) onChange({ ...novo, ...r })
      else setAvisoCep('Não achei esse CEP. Preencha o endereço à mão.')
    }
  }

  return (
    <>
      <div className="linha-campos">
        <div className="campo">
          <label htmlFor={`${prefixo}-dest`}>Quem recebe</label>
          <input id={`${prefixo}-dest`} value={valor.destinatario} onChange={(e) => set('destinatario', e.target.value)} autoComplete="name" />
        </div>
        <div className="campo campo-medio">
          <label htmlFor={`${prefixo}-tel`}>Telefone</label>
          <input id={`${prefixo}-tel`} inputMode="tel" value={mascaraTelefone(valor.telefone)} onChange={(e) => set('telefone', e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <div className="linha-campos">
        <div className="campo campo-medio">
          <label htmlFor={`${prefixo}-cep`}>CEP</label>
          <input id={`${prefixo}-cep`} inputMode="numeric" placeholder="00000-000" value={mascaraCep(valor.cep)} onChange={(e) => aoDigitarCep(e.target.value)} autoComplete="postal-code" />
        </div>
        <div className="campo">
          <label htmlFor={`${prefixo}-rua`}>Rua / avenida</label>
          <input id={`${prefixo}-rua`} value={valor.rua} onChange={(e) => set('rua', e.target.value)} autoComplete="address-line1" />
        </div>
        <div className="campo campo-curto">
          <label htmlFor={`${prefixo}-num`}>Número</label>
          <input id={`${prefixo}-num`} value={valor.numero} onChange={(e) => set('numero', e.target.value)} />
        </div>
      </div>
      {(buscando || avisoCep) && <span className="dica">{buscando ? 'Buscando CEP...' : avisoCep}</span>}
      <div className="linha-campos">
        <div className="campo">
          <label htmlFor={`${prefixo}-comp`}>Complemento (opcional)</label>
          <input id={`${prefixo}-comp`} value={valor.complemento} onChange={(e) => set('complemento', e.target.value)} autoComplete="address-line2" />
        </div>
        <div className="campo">
          <label htmlFor={`${prefixo}-bairro`}>Bairro</label>
          <input id={`${prefixo}-bairro`} value={valor.bairro} onChange={(e) => set('bairro', e.target.value)} />
        </div>
      </div>
      <div className="linha-campos">
        <div className="campo">
          <label htmlFor={`${prefixo}-cidade`}>Cidade</label>
          <input id={`${prefixo}-cidade`} value={valor.cidade} onChange={(e) => set('cidade', e.target.value)} autoComplete="address-level2" />
        </div>
        <div className="campo campo-curto">
          <label htmlFor={`${prefixo}-uf`}>UF</label>
          <input id={`${prefixo}-uf`} maxLength={2} value={valor.uf} onChange={(e) => set('uf', e.target.value.toUpperCase())} autoComplete="address-level1" />
        </div>
      </div>
    </>
  )
}
