import { describe, expect, it } from 'vitest'
import { ABAS, destinoAoVoltar, direcaoTransicao, handleAtual, type Handle } from './telas'

describe('telas', () => {
  it('UT-001 handleAtual devolve o último handle', () => {
    expect(handleAtual([{ handle: { nivel: 'raiz' } }, { handle: { nivel: 'sub', aba: 'pedidos' } }])).toEqual({
      nivel: 'sub',
      aba: 'pedidos',
    })
  })

  it('UT-002 handleAtual sem handles → undefined', () => {
    expect(handleAtual([{ handle: undefined }, { handle: undefined }])).toBeUndefined()
  })

  it('UT-003 PUSH de raiz para sub → push', () => {
    expect(direcaoTransicao('PUSH', { nivel: 'raiz' }, { nivel: 'sub' }, true)).toBe('push')
  })

  it('UT-004 PUSH de sub para raiz → nenhuma', () => {
    expect(direcaoTransicao('PUSH', { nivel: 'sub' }, { nivel: 'raiz' }, true)).toBe('nenhuma')
  })

  it('UT-005 POP saindo de sub → pop', () => {
    expect(direcaoTransicao('POP', { nivel: 'sub' }, { nivel: 'raiz' }, true)).toBe('pop')
  })

  it('UT-006 POP entre raízes → nenhuma', () => {
    expect(direcaoTransicao('POP', { nivel: 'raiz' }, { nivel: 'raiz' }, true)).toBe('nenhuma')
  })

  const niveis: Handle[] = [{ nivel: 'raiz' }, { nivel: 'sub' }]
  const casos = (['PUSH', 'POP', 'REPLACE'] as const).flatMap((tipo) =>
    niveis.flatMap((anterior) => niveis.map((atual) => [tipo, anterior, atual] as const)),
  )
  it.each(casos)('UT-007 computador nunca anima (%s %o → %o)', (tipo, anterior, atual) => {
    expect(direcaoTransicao(tipo, anterior, atual, false)).toBe('nenhuma')
  })

  it('UT-008 REPLACE para sub → push', () => {
    expect(direcaoTransicao('REPLACE', undefined, { nivel: 'sub' }, true)).toBe('push')
  })

  it('UT-009 voltar com histórico interno → -1', () => {
    expect(destinoAoVoltar({ nivel: 'sub', aba: 'pedidos' }, true)).toBe(-1)
  })

  it('UT-010 voltar sem histórico → raiz da aba dona', () => {
    expect(destinoAoVoltar({ nivel: 'sub', aba: 'pedidos' }, false)).toBe('/pedidos')
  })

  it('UT-011 voltar sem aba ou sem handle → /', () => {
    expect(destinoAoVoltar({ nivel: 'sub' }, false)).toBe('/')
    expect(destinoAoVoltar(undefined, false)).toBe('/')
  })

  it('UT-012 ABAS na ordem com rótulos e destinos', () => {
    expect(ABAS).toEqual([
      { aba: 'inicio', rotulo: 'Início', para: '/' },
      { aba: 'buscar', rotulo: 'Buscar', para: '/buscar' },
      { aba: 'carrinho', rotulo: 'Carrinho', para: '/carrinho' },
      { aba: 'pedidos', rotulo: 'Pedidos', para: '/pedidos' },
      { aba: 'conta', rotulo: 'Conta', para: '/conta' },
    ])
  })
})
