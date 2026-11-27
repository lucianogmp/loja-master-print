import { describe, expect, it } from 'vitest'
import { podeCancelar } from './pedidos'

describe('podeCancelar', () => {
  it('só enquanto está recebido e sem pagamento confirmado', () => {
    expect(podeCancelar({ etapa: 1, pagamento: null })).toBe(true)
    expect(podeCancelar({ etapa: 1, pagamento: { status: 'aguardando', link: null } })).toBe(true)
    expect(podeCancelar({ etapa: 1, pagamento: { status: 'pago', link: null } })).toBe(false)
    expect(podeCancelar({ etapa: 2, pagamento: null })).toBe(false)
    expect(podeCancelar({ etapa: 0, pagamento: null })).toBe(false)
  })
})
