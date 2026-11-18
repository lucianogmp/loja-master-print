import { useEffect, useMemo, useState } from 'react'
import { useAjustes } from './ajustes'
import { useCatalogo } from './catalogo'
import { consultarFrete, envioPronto, opcaoDoItem, produtoIdDoItem, soRetiradaDoItem, type OpcaoFrete } from './envio'
import type { ItemCarrinho } from './cart'

const CHAVE_CEP = 'master-print-cep'
const CHAVE_SERV = 'master-print-frete-servico'

export function cepSalvo(): string {
  try { return (localStorage.getItem(CHAVE_CEP) ?? '').replace(/\D/g, '').slice(0, 8) } catch { return '' }
}
export function guardarCep(cep: string) {
  try { localStorage.setItem(CHAVE_CEP, cep) } catch { /* sem armazenamento */ }
}

/** Frete do carrinho a partir só do CEP (sem login). O preço sempre vem dos Correios. */
export function useFreteCarrinho(itens: ItemCarrinho[], cepInicial?: string) {
  const { ajustes } = useAjustes()
  const { produtoPorSlug } = useCatalogo()
  const [cep, setCepEstado] = useState(() => (cepInicial ?? '').replace(/\D/g, '').slice(0, 8) || cepSalvo())
  const [opcoes, setOpcoes] = useState<OpcaoFrete[]>([])
  const [codigo, setCodigo] = useState(() => { try { return localStorage.getItem(CHAVE_SERV) ?? '' } catch { return '' } })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [detalhe, setDetalhe] = useState('')

  const ligado = ajustes.frete.ligado
  const produtos = itens.map((i) => ({ i, p: produtoPorSlug(i.slug) })).filter((x) => !!x.p) as { i: ItemCarrinho; p: NonNullable<ReturnType<typeof produtoPorSlug>> }[]
  const soRetirada = produtos.some(({ i, p }) => soRetiradaDoItem(p, i.variacaoId))
  const semEnvio = [...new Set(produtos.filter(({ i, p }) => !envioPronto(p, i.variacaoId)).map(({ p }) => p.nome))]
  const disponivel = ligado && produtos.length > 0 && !soRetirada && semEnvio.length === 0
  const chave = useMemo(() => itens.map((i) => `${i.slug}:${i.variacaoId}:${i.quantidade}`).join('|'), [itens])

  function setCep(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8)
    setCepEstado(d)
    guardarCep(d)
  }

  useEffect(() => {
    if (!disponivel || cep.length !== 8) { setOpcoes([]); setErro(''); setDetalhe(''); return }
    let vivo = true
    setCarregando(true); setErro(''); setDetalhe('')
    const lista = produtos.map(({ i, p }) => ({ produto_id: produtoIdDoItem(p, i.variacaoId), quantidade: i.quantidade, opcao: opcaoDoItem(p, i.variacaoId) }))
    consultarFrete(cep, lista).then((r) => {
      if (!vivo) return
      setCarregando(false)
      if (r.ok) setOpcoes(r.opcoes)
      else { setOpcoes([]); setErro(r.erro); setDetalhe(r.detalhe ?? '') }
    })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponivel, cep, chave])

  const escolhida = opcoes.find((o) => o.codigo === codigo) ?? opcoes[0]
  function escolher(c: string) {
    setCodigo(c)
    try { localStorage.setItem(CHAVE_SERV, c) } catch { /* sem armazenamento */ }
  }
  return { ligado, disponivel, soRetirada, semEnvio, cep, setCep, opcoes, escolhida, escolher, carregando, erro, detalhe }
}
