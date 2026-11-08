import { describe, expect, it } from 'vitest'
import { percentualDesconto, precoComPromocao } from './promocao'

describe('promoção do site', () => {
  it('percentual tira % do preço de tabela, arredondando em centavos', () => {
    expect(precoComPromocao(50, { tipo: 'percentual', valor: 20 })).toBe(40)
    expect(precoComPromocao(33.33, { tipo: 'percentual', valor: 15 })).toBe(28.33)
  })

  it('"de → por" usa o preço informado só se for menor que o de tabela', () => {
    expect(precoComPromocao(50, { tipo: 'preco', valor: 39.9 })).toBe(39.9)
    expect(precoComPromocao(50, { tipo: 'preco', valor: 50 })).toBe(50)
    expect(precoComPromocao(50, { tipo: 'preco', valor: 70 })).toBe(50)
  })

  it('promoção ausente ou inválida não muda o preço', () => {
    expect(precoComPromocao(50)).toBe(50)
    expect(precoComPromocao(50, { tipo: 'percentual', valor: 0 })).toBe(50)
    expect(precoComPromocao(50, { tipo: 'percentual', valor: 100 })).toBe(50)
  })

  it('percentual mostrado no selo', () => {
    expect(percentualDesconto(50, 40)).toBe(20)
    expect(percentualDesconto(50, 50)).toBe(0)
  })
})
