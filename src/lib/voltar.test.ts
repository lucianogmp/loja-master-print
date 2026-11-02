import { describe, expect, it } from 'vitest'
import { comVoltar, destinoSeguro } from './voltar'

describe('voltar', () => {
  it('UT-029 caminho interno é aceito', () => {
    expect(destinoSeguro('/checkout')).toBe('/checkout')
  })

  it('UT-030 endereço externo → /conta', () => {
    expect(destinoSeguro('https://evil.com')).toBe('/conta')
  })

  it('UT-031 // → /conta', () => {
    expect(destinoSeguro('//evil.com')).toBe('/conta')
  })

  it('UT-032 esquema rejeitado; dois-pontos depois da barra aceito', () => {
    expect(destinoSeguro('javascript:alert(1)')).toBe('/conta')
    expect(destinoSeguro('/x:y')).toBe('/x:y')
  })

  it.each(['/entrar', '/cadastro?x', '/esqueci-senha', '/redefinir-senha', '/confirme-email'])(
    'UT-033 telas de login não são destino (%s)',
    (caminho) => {
      expect(destinoSeguro(caminho)).toBe('/conta')
    },
  )

  it('UT-034 administração não é destino', () => {
    expect(destinoSeguro('/admin')).toBe('/conta')
    expect(destinoSeguro('/admin/produtos')).toBe('/conta')
  })

  it('UT-035 até 500 caracteres', () => {
    const de500 = '/' + 'a'.repeat(499)
    expect(destinoSeguro(de500)).toBe(de500)
    expect(destinoSeguro(de500 + 'a')).toBe('/conta')
  })

  it('UT-036 comVoltar codifica o destino', () => {
    expect(comVoltar('/entrar', '/pedidos/5')).toBe('/entrar?voltar=%2Fpedidos%2F5')
  })

  it('UT-037 comVoltar ignora destino inseguro', () => {
    expect(comVoltar('/entrar', 'https://x')).toBe('/entrar')
  })

  it('UT-038 comVoltar omite o padrão e o vazio', () => {
    expect(comVoltar('/entrar', '/conta')).toBe('/entrar')
    expect(comVoltar('/entrar', null)).toBe('/entrar')
  })
})
