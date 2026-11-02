import { act } from '@testing-library/react'
import { vi } from 'vitest'

/** Dispara um `beforeinstallprompt` falso; `resultado` é o que o usuário escolhe no pedido nativo. */
export function dispararInstalacao(resultado: 'accepted' | 'dismissed' = 'accepted') {
  const evento = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome: resultado }),
  })
  act(() => void window.dispatchEvent(evento))
  return evento
}

export function definirUserAgent(ua: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
}

export const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
export const UA_INSTAGRAM = `${UA_IPHONE} Instagram 300.0.0`
