import { describe, expect, it, vi } from 'vitest'
import { gravarJson, lerJson, removerChaves } from './armazenamento'

describe('armazenamento', () => {
  it('UT-013 grava e lê com versão', () => {
    expect(gravarJson('k', 1, { a: 1 })).toBe(true)
    expect(lerJson('k', 1)).toEqual({ a: 1 })
    expect(localStorage.getItem('k')).toContain('"v":1')
  })

  it('UT-014 JSON corrompido → null sem exceção', () => {
    localStorage.setItem('k', '{bad')
    expect(() => lerJson('k', 1)).not.toThrow()
    expect(lerJson('k', 1)).toBeNull()
  })

  it('UT-015 versão diferente → null e a chave é removida', () => {
    gravarJson('k', 1, { a: 1 })
    expect(lerJson('k', 2)).toBeNull()
    expect(localStorage.getItem('k')).toBeNull()
  })

  it('UT-016 armazenamento lançando erro → null / false', () => {
    const ler = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const gravar = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cheio')
    })
    expect(lerJson('k', 1)).toBeNull()
    expect(gravarJson('k', 1, { a: 1 })).toBe(false)
    ler.mockRestore()
    gravar.mockRestore()
  })

  it('UT-017 removerChaves apaga só o prefixo', () => {
    localStorage.setItem('loja-pedidos:a', '1')
    localStorage.setItem('loja-pedidos:b', '2')
    localStorage.setItem('outra', '3')
    removerChaves('loja-pedidos:')
    expect(localStorage.getItem('loja-pedidos:a')).toBeNull()
    expect(localStorage.getItem('loja-pedidos:b')).toBeNull()
    expect(localStorage.getItem('outra')).toBe('3')
  })

  it('UT-018 chave ausente → null', () => {
    expect(lerJson('ausente', 1)).toBeNull()
  })
})
