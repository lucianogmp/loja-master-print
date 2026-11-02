import { describe, expect, it, vi } from 'vitest'
import { limparRecentes, lerRecentes, salvarRecente } from './buscasRecentes'

const CHAVE = 'loja-buscas-recentes'

describe('buscasRecentes', () => {
  it('UT-039 o termo mais novo vem primeiro', () => {
    salvarRecente('banner')
    salvarRecente('cartão')
    expect(lerRecentes()).toEqual(['cartão', 'banner'])
  })

  it('UT-040 termo repetido (outra caixa, com espaços) sobe ao topo sem duplicar', () => {
    salvarRecente('banner')
    salvarRecente('cartão')
    expect(salvarRecente('  BANNER ')).toEqual(['banner', 'cartão'])
    expect(lerRecentes()).toEqual(['banner', 'cartão'])
  })

  it('UT-041 guarda só os cinco mais recentes', () => {
    ;['a', 'b', 'c', 'd', 'e', 'f'].forEach(salvarRecente)
    expect(lerRecentes()).toEqual(['f', 'e', 'd', 'c', 'b'])
  })

  it('UT-042 termo em branco não muda a lista', () => {
    salvarRecente('banner')
    expect(salvarRecente('   ')).toEqual(['banner'])
    expect(lerRecentes()).toEqual(['banner'])
  })

  it('UT-043 termo de 150 caracteres é guardado inteiro', () => {
    const longo = 'x'.repeat(150)
    salvarRecente(longo)
    expect(lerRecentes()[0]).toHaveLength(150)
  })

  it('UT-044 limpar esvazia a lista e remove a chave', () => {
    salvarRecente('banner')
    limparRecentes()
    expect(lerRecentes()).toEqual([])
    expect(localStorage.getItem(CHAVE)).toBeNull()
  })

  it('UT-045 armazenamento que lança → lista vazia, sem exceção', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(lerRecentes()).toEqual([])
    expect(salvarRecente('x')).toEqual([])
    vi.restoreAllMocks()
  })

  it('UT-046 JSON corrompido → lista vazia', () => {
    localStorage.setItem(CHAVE, '{oops')
    expect(lerRecentes()).toEqual([])
  })
})
