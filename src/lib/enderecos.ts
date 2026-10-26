import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

// Endereços do comprador (tabela enderecos no projeto de compradores; cada pessoa só enxerga os seus).

export type EnderecoCampos = {
  destinatario: string
  telefone: string
  cep: string // só dígitos
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export type Endereco = EnderecoCampos & { id: string; apelido: string | null; padrao: boolean }

export const ENDERECO_VAZIO: EnderecoCampos = {
  destinatario: '',
  telefone: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
}

export const so = (s: string) => s.replace(/\D/g, '')

export function mascaraCep(v: string) {
  const d = so(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function mascaraTelefone(v: string) {
  const d = so(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function textoEndereco(e: EnderecoCampos) {
  return `${e.rua}, ${e.numero}${e.complemento ? ` (${e.complemento})` : ''} — ${e.bairro} — ${e.cidade}/${e.uf} — CEP ${mascaraCep(e.cep)}`
}

/** Devolve a mensagem do primeiro problema, ou null se estiver tudo certo. */
export function validarEndereco(e: EnderecoCampos): string | null {
  if (!e.destinatario.trim()) return 'Informe o nome de quem vai receber.'
  if (so(e.cep).length !== 8) return 'CEP inválido.'
  if (!e.rua.trim()) return 'Informe a rua.'
  if (!e.numero.trim()) return 'Informe o número (ou "s/n").'
  if (!e.bairro.trim()) return 'Informe o bairro.'
  if (!e.cidade.trim()) return 'Informe a cidade.'
  if (!/^[A-Za-z]{2}$/.test(e.uf.trim())) return 'Informe o estado com 2 letras (ex.: MG).'
  return null
}

/** Consulta pública de CEP (ViaCEP). Só o CEP sai do navegador. Se falhar, a pessoa preenche à mão. */
export async function buscarCep(cep: string): Promise<Partial<EnderecoCampos> | null> {
  const d = so(cep)
  if (d.length !== 8) return null
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`)
    if (!r.ok) return null
    const j = await r.json()
    if (j.erro) return null
    return { rua: j.logradouro ?? '', bairro: j.bairro ?? '', cidade: j.localidade ?? '', uf: j.uf ?? '' }
  } catch {
    return null
  }
}

type Linha = {
  id: string
  apelido: string | null
  destinatario: string
  telefone: string | null
  cep: string
  rua: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
  padrao: boolean
}

const dessaLinha = (l: Linha): Endereco => ({
  ...l,
  telefone: l.telefone ?? '',
  complemento: l.complemento ?? '',
})

export function paraLinha(e: EnderecoCampos, userId: string) {
  return {
    user_id: userId,
    destinatario: e.destinatario.trim(),
    telefone: so(e.telefone) || null,
    cep: so(e.cep),
    rua: e.rua.trim(),
    numero: e.numero.trim(),
    complemento: e.complemento.trim() || null,
    bairro: e.bairro.trim(),
    cidade: e.cidade.trim(),
    uf: e.uf.trim().toUpperCase(),
  }
}

export function useEnderecos() {
  const { session } = useAuth()
  const [lista, setLista] = useState<Endereco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [indisponivel, setIndisponivel] = useState(false)

  const recarregar = useCallback(async () => {
    if (!session) return
    const { data, error } = await supabase
      .from('enderecos')
      .select('id,apelido,destinatario,telefone,cep,rua,numero,complemento,bairro,cidade,uf,padrao')
      .order('padrao', { ascending: false })
      .order('created_at')
    if (error) setIndisponivel(true)
    else {
      setIndisponivel(false)
      setLista((data as Linha[]).map(dessaLinha))
    }
    setCarregando(false)
  }, [session])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { lista, carregando, indisponivel, recarregar }
}
