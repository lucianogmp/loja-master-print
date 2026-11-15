import { describe, expect, it } from 'vitest'
import { montarGrupo, type GrupoDb, type Linha } from './catalogo'
import { envioPronto, produtoIdDoItem, soRetiradaDoItem } from './envio'
import { calcularTotal } from './preco'

const linha = (id: string, nome: string, preco: number | null, extra: Partial<Linha> = {}): Linha => ({
  id, slug: id, nome, categoria: 'Impressos', categoria_original: 'Impressos', categoria_imagem: null, categoria_ordem: 0,
  por_metro_quadrado: false, preco, prazo_entrega_dias: 3, descricao_publica: 'Cartão bonito', imagens: [],
  peso_kg: null, comprimento_cm: null, largura_cm: null, altura_cm: null, entrega_modo: 'envio_e_retirada', destaque: false, ordem: 0,
  ...extra,
})
const grupo: GrupoDb = {
  id: 'g1', slug: 'cartao-de-visita', nome: 'Cartão de visita', descricao: null, imagens: [], destaque: false, ordem: 0,
  principal_id: null, rotulo_a: 'Impressão', rotulo_b: 'Quantidade',
  itens: [
    { produto_id: 'a4', a: '4x4', b: '1000 unidades' },
    { produto_id: 'a1', a: '4x0', b: '1000 unidades' },
    { produto_id: 'a2', a: '4x0', b: '250 unidades' },
    { produto_id: 'a3', a: '4x4', b: '250 unidades' },
  ],
}
const linhas = new Map([
  ['a1', linha('a1', 'CV 4x0 1000', 90, { peso_kg: 1, comprimento_cm: 10, largura_cm: 6, altura_cm: 5 })],
  ['a2', linha('a2', 'CV 4x0 250', 40, { peso_kg: 0.3, comprimento_cm: 10, largura_cm: 6, altura_cm: 2 })],
  ['a3', linha('a3', 'CV 4x4 250', 55, { entrega_modo: 'so_retirada' })],
  ['a4', linha('a4', 'CV 4x4 1000', 120)],
])

describe('grupos de produtos', () => {
  const p = montarGrupo(grupo, linhas, new Map())!
  it('cada variação é o produto real, impressões na ordem da lista e quantidades crescentes', () => {
    expect(p.variacoes.map((v) => v.produtoId)).toEqual(['a3', 'a4', 'a2', 'a1'])
    expect(p.grupo).toEqual({ rotuloA: 'Impressão', rotuloB: 'Quantidade' })
  })
  it('preço e produto do pedido são os da variação escolhida', () => {
    expect(calcularTotal(p, { variacaoId: 'a1', quantidade: 1 })).toBe(90)
    expect(produtoIdDoItem(p, 'a4')).toBe('a4')
  })
  it('envio e retirada seguem o produto escolhido', () => {
    expect(envioPronto(p, 'a2')).toBe(true)
    expect(envioPronto(p, 'a4')).toBe(false)
    expect(soRetiradaDoItem(p, 'a3')).toBe(true)
    expect(soRetiradaDoItem(p, 'a1')).toBe(false)
  })
  it('promoção do produto aparece só na variação dele', () => {
    const g = montarGrupo(grupo, linhas, new Map([['a1', { tipo: 'percentual' as const, valor: 10 }]]))!
    const v = g.variacoes.find((x) => x.id === 'a1')!
    expect(v.preco).toBe(81)
    expect(v.precoOriginal).toBe(90)
  })
  it('sem a coluna de impressão, só aparece o seletor de quantidade', () => {
    const g = montarGrupo({ ...grupo, itens: [{ produto_id: 'a2', a: null, b: '250' }, { produto_id: 'a1', a: null, b: '1000' }] }, linhas, new Map())!
    expect(g.grupo).toEqual({ rotuloA: undefined, rotuloB: 'Quantidade' })
  })
})
