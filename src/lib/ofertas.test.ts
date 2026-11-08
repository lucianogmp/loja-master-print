import { describe, expect, it } from 'vitest'
import { janelaDaData, proximaOcorrencia } from './datasComerciais'
import { diasParaOferta, paraOferta, tituloDaOferta } from './ofertas'
import { normalizarInicio } from './site'

describe('datas comerciais no site', () => {
  it('Black Friday é a sexta depois da 4ª quinta de novembro', () => {
    expect(proximaOcorrencia({ regra: 'black_friday', mes: null, dia: null }, '2026-11-01')).toBe('2026-11-27')
    expect(proximaOcorrencia({ regra: 'black_friday', mes: null, dia: null }, '2025-11-01')).toBe('2025-11-28')
  })

  it('Dia das Mães é o 2º domingo de maio; Páscoa 2026 é 5 de abril', () => {
    expect(proximaOcorrencia({ regra: 'dia_das_maes', mes: null, dia: null }, '2026-05-01')).toBe('2026-05-10')
    expect(proximaOcorrencia({ regra: 'pascoa', mes: null, dia: null }, '2026-01-01')).toBe('2026-04-05')
  })

  it('janela: dentro dos dias antes aparece; fora não; no dia ainda aparece; depois some', () => {
    const natal = { regra: 'fixa' as const, mes: 12, dia: 25 }
    expect(janelaDaData(natal, 30, '2026-11-25')?.dias).toBe(30)
    expect(janelaDaData(natal, 30, '2026-11-24')).toBeNull()
    expect(janelaDaData(natal, 30, '2026-12-25')?.dias).toBe(0)
    expect(janelaDaData(natal, 30, '2026-12-26')).toBeNull()
  })

  it('título padrão "Ofertas de {nome}" e título próprio quando definido', () => {
    const o = paraOferta({ id: '1', nome: 'Dia dos Professores', regra: 'fixa', mes: 10, dia: 15, dias_antes: 20, titulo: null, texto: null, produtos: null })
    expect(o.slug).toBe('dia-dos-professores')
    expect(tituloDaOferta(o)).toBe('Ofertas de Dia dos Professores')
    expect(tituloDaOferta({ ...o, titulo: 'Semana do Professor' })).toBe('Semana do Professor')
    expect(diasParaOferta(o, '2026-09-01')).toBeNull()
    expect(diasParaOferta(o, '2026-10-01')).toBe(14)
  })

  it('home existente ganha Destaques e Ofertas no topo, mantendo a ordem salva', () => {
    const i = normalizarInicio({
      secoes: [
        { id: 'produtos', titulo: 'Tudo', visivel: true },
        { id: 'beneficios', titulo: 'Vantagens', visivel: false },
      ],
    })
    expect(i.secoes.map((s) => s.id)).toEqual(['destaques', 'ofertas', 'produtos', 'beneficios', 'mais_vendidos'])
    expect(i.secoes.find((s) => s.id === 'beneficios')?.visivel).toBe(false)
  })
})
