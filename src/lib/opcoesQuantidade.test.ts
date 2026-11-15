import { describe, expect, it } from 'vitest'
import { opcoesValidas } from './catalogo'
import { envioPronto, opcaoDoItem } from './envio'
import { calcularTotal } from './preco'
import type { Produto } from './tipos'

const base: Produto = {
  id: 'p', slug: 'cartao', nome: 'Cartão de visita', categoria: 'c', arte: 'cartao', resumo: '', descricao: '', imagens: [],
  entregaModo: 'envio_e_retirada', tipoPreco: 'pacote', temOpcoes: true, rotuloVariacao: 'Quantidade', prazo: '', precisaArte: true,
  pacoteCm: { comprimento: 10, largura: 6, altura: 3 },
  variacoes: [
    { id: 'q250', label: '250 unidades', preco: 40, quantidade: 250, pesoKg: 0.3 },
    { id: 'q500', label: '500 unidades', preco: 65, quantidade: 500 },
  ],
}

describe('quantidades fechadas', () => {
  it('descarta opções inválidas e repetidas e ordena', () => {
    const l = opcoesValidas([{ quantidade: 500, preco: 65 }, { quantidade: 250, preco: '40' }, { quantidade: 250, preco: 1 }, { quantidade: 0, preco: 5 }, { quantidade: 100, preco: 0 }])
    expect(l.map((o) => o.quantidade)).toEqual([250, 500])
  })
  it('o total é o preço fechado da opção escolhida', () => {
    expect(calcularTotal(base, { variacaoId: 'q500', quantidade: 1 })).toBe(65)
  })
  it('envio só quando a opção tem peso (da opção ou do produto)', () => {
    expect(envioPronto(base, 'q250')).toBe(true)
    expect(envioPronto(base, 'q500')).toBe(false)
    expect(envioPronto({ ...base, pesoKg: 0.5 }, 'q500')).toBe(true)
  })
  it('informa a quantidade da opção para o servidor', () => {
    expect(opcaoDoItem(base, 'q500')).toBe(500)
    expect(opcaoDoItem({ ...base, temOpcoes: false }, 'q500')).toBeUndefined()
  })
})
