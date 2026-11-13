import { describe, expect, it } from 'vitest'
import { AJUSTES_PADRAO, normalizarAjustes } from './ajustes'
import { envioPronto } from './envio'
import type { Produto } from './tipos'

describe('normalizarAjustes', () => {
  it('sem dados, tudo desligado', () => {
    const a = normalizarAjustes(undefined)
    expect(a.pagamento.ligado).toBe(false)
    expect(a.frete.ligado).toBe(false)
    expect(a.frete.servicos).toEqual(AJUSTES_PADRAO.frete.servicos)
  })
  it('só liga com true de verdade e limpa valores ruins', () => {
    const a = normalizarAjustes({
      pagamento: { ligado: 'sim' },
      frete: { ligado: true, embalagem: -3, gratisAcima: 'x', diasExtras: 2.6, servicos: [{ codigo: '03298', nome: 'PAC' }, { codigo: 'abc', nome: 'ruim' }] },
    })
    expect(a.pagamento.ligado).toBe(false)
    expect(a.frete).toMatchObject({ ligado: true, embalagem: 0, gratisAcima: 0, diasExtras: 3 })
    expect(a.frete.servicos).toEqual([{ codigo: '03298', nome: 'PAC', ativo: true }])
  })
})

describe('envioPronto', () => {
  const base = { entregaModo: 'envio_e_retirada', pesoKg: 0.4, pacoteCm: { comprimento: 20, largura: 15, altura: 5 } } as Produto
  it('exige peso e medidas e não ser só retirada', () => {
    expect(envioPronto(base)).toBe(true)
    expect(envioPronto({ ...base, pesoKg: undefined })).toBe(false)
    expect(envioPronto({ ...base, pacoteCm: undefined })).toBe(false)
    expect(envioPronto({ ...base, entregaModo: 'so_retirada' })).toBe(false)
  })
})
