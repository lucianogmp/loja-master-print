import { describe, expect, it } from 'vitest'
import { corAvatar, iniciais, PALETA_AVATAR } from './avatar'

// Contraste WCAG calculado a partir da luminância relativa
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contraste(a: string, b: string) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

describe('avatar', () => {
  it('UT-019 nome e sobrenome → duas iniciais', () => {
    expect(iniciais('Ana Souza', 'x@y.z')).toBe('AS')
  })

  it('UT-020 um nome → uma inicial', () => {
    expect(iniciais('Ana', 'x@y.z')).toBe('A')
  })

  it('UT-021 usa a última palavra mesmo partícula; espaços colapsados', () => {
    expect(iniciais('  José   da ', 'x@y.z')).toBe('JD')
  })

  it('UT-022 sem nome → inicial do e-mail', () => {
    expect(iniciais('', 'maria@x.z')).toBe('M')
    expect(iniciais(undefined, 'maria@x.z')).toBe('M')
  })

  it('UT-023 nome sem letras → inicial do e-mail', () => {
    expect(iniciais('123 !!', 'maria@x.z')).toBe('M')
  })

  it('UT-024 mantém acentos', () => {
    expect(iniciais('Érica Ávila', 'x@y.z')).toBe('ÉÁ')
  })

  it('UT-025 mesma semente → mesma cor', () => {
    expect(corAvatar('Ana Souza')).toEqual(corAvatar('Ana Souza'))
  })

  it('UT-026 no máximo 8 fundos, todos da paleta', () => {
    const fundos = new Set(Array.from({ length: 200 }, (_, i) => corAvatar(`pessoa ${i}`).fundo))
    expect(fundos.size).toBeLessThanOrEqual(8)
    fundos.forEach((f) => expect(PALETA_AVATAR.map((p) => p.fundo)).toContain(f))
  })

  it('UT-027 todo par da paleta tem contraste ≥ 4,5', () => {
    expect(PALETA_AVATAR).toHaveLength(8)
    PALETA_AVATAR.forEach((p) => expect(contraste(p.fundo, p.texto)).toBeGreaterThanOrEqual(4.5))
  })

  it('UT-028 semente vazia → primeira cor, sem erro', () => {
    expect(corAvatar('')).toEqual(PALETA_AVATAR[0])
  })
})
