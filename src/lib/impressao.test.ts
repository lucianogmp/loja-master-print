import { describe, expect, it } from 'vitest'
import { explicarImpressao } from './impressao'

describe('explicarImpressao', () => {
  it('explica os códigos mais comuns', () => {
    expect(explicarImpressao('4x0')).toBe('Só a frente, colorida. O verso fica sem impressão.')
    expect(explicarImpressao('4x1')).toBe('Frente colorida e verso preto e branco.')
    expect(explicarImpressao('4x4')).toBe('Frente e verso coloridos.')
    expect(explicarImpressao('1x1')).toBe('Frente e verso preto e branco.')
    expect(explicarImpressao('1x0')).toBe('Só a frente, preto e branco. O verso fica sem impressão.')
  })
  it('aceita variações de escrita e ignora o que não conhece', () => {
    expect(explicarImpressao(' 4 X 4 ')).toBe('Frente e verso coloridos.')
    expect(explicarImpressao('Colorido')).toBeNull()
    expect(explicarImpressao('2x0')).toBeNull()
    expect(explicarImpressao(undefined)).toBeNull()
  })
})
