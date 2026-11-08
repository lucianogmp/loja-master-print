import { useEffect, useMemo, useState } from 'react'
import { erp } from './erp'
import { hojeISO, janelaDaData, type RegraData } from './datasComerciais'

// Ofertas = datas comerciais cadastradas no ERP (Natal, Black Friday, Dia dos Professores...).
// Vêm pela função pública loja_ofertas() (só campanhas ativas e liberadas para o site, com os produtos já publicados).
// Perto da data, a loja mostra "Ofertas de {data}" sozinha; fora da janela, some.

export type Oferta = {
  id: string
  slug: string
  nome: string
  regra: RegraData
  mes: number | null
  dia: number | null
  diasAntes: number
  titulo: string // vazio = "Ofertas de {nome}"
  texto: string
  produtos: string[] // ids de produtos do ERP (iguais aos ids do catálogo)
}

type Linha = {
  id: string
  nome: string
  regra: RegraData
  mes: number | null
  dia: number | null
  dias_antes: number
  titulo: string | null
  texto: string | null
  produtos: string[] | null
}

export const slugDe = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function paraOferta(l: Linha): Oferta {
  return {
    id: l.id,
    slug: slugDe(l.nome) || l.id,
    nome: l.nome,
    regra: l.regra,
    mes: l.mes,
    dia: l.dia,
    diasAntes: Number(l.dias_antes),
    titulo: l.titulo ?? '',
    texto: l.texto ?? '',
    produtos: l.produtos ?? [],
  }
}

export const tituloDaOferta = (o: Pick<Oferta, 'titulo' | 'nome'>) => o.titulo || `Ofertas de ${o.nome}`

/** Faltam quantos dias, se hoje está na janela da oferta; null = fora do ar. */
export function diasParaOferta(o: Oferta, hoje = hojeISO()): number | null {
  return janelaDaData(o, o.diasAntes, hoje)?.dias ?? null
}

export function useOfertas() {
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [carregando, setCarregando] = useState(true)
  useEffect(() => {
    let vivo = true
    erp.rpc('loja_ofertas').then(({ data, error }) => {
      if (!vivo) return
      if (!error && Array.isArray(data)) setOfertas((data as Linha[]).map(paraOferta))
      setCarregando(false)
    })
    return () => {
      vivo = false
    }
  }, [])
  return useMemo(() => ({ ofertas, carregando }), [ofertas, carregando])
}
