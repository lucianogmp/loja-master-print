import { useCallback, useState, useSyncExternalStore } from 'react'
import { gravarJson, lerJson } from '../lib/armazenamento'

type Plataforma = 'ios' | 'android' | 'navegador-embutido' | 'outro'
type Resultado = 'aceitou' | 'recusou' | 'indisponivel'

type EventoInstalar = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CHAVE = 'loja-dica-instalar'
const DIAS_30 = 30 * 24 * 60 * 60 * 1000
const PARA_SEMPRE = '9999-12-31T00:00:00.000Z'

// O evento chega uma vez, possivelmente antes de qualquer tela montar: fica guardado no módulo
let evento: EventoInstalar | null = null
let versao = 0
const ouvintes = new Set<() => void>()

function avisar() {
  versao++
  ouvintes.forEach((o) => o())
}

function assinar(o: () => void) {
  ouvintes.add(o)
  return () => void ouvintes.delete(o)
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    evento = e as EventoInstalar
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    evento = null
    avisar()
  })
}

/** Só para os testes: esquece o evento capturado. */
export function reiniciarInstalacao() {
  evento = null
  avisar()
}

function lerDispensada(): boolean {
  const salvo = lerJson<{ dispensadaEm?: string }>(CHAVE, 1)
  const quando = salvo?.dispensadaEm ? Date.parse(salvo.dispensadaEm) : NaN
  return Number.isFinite(quando) && Date.now() - quando < DIAS_30
}

function gravarDispensada(em: string) {
  gravarJson(CHAVE, 1, { dispensadaEm: em })
  avisar()
}

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|Snapchat/i.test(ua)) return 'navegador-embutido'
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'outro'
}

function detectarInstalado(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Estado da instalação na tela inicial: instalado, pedido nativo (Android/Chrome), plataforma e dispensa de 30 dias. */
export function useInstalacao() {
  const [instalado] = useState(detectarInstalado)
  const [plataforma] = useState(detectarPlataforma)
  useSyncExternalStore(assinar, () => versao)
  const podeSolicitar = evento !== null
  const dispensada = lerDispensada()

  const solicitar = useCallback(async (): Promise<Resultado> => {
    const e = evento
    if (!e) return 'indisponivel'
    try {
      await e.prompt()
      const { outcome } = await e.userChoice
      if (outcome === 'accepted') {
        evento = null
        gravarDispensada(PARA_SEMPRE)
        return 'aceitou'
      }
      return 'recusou'
    } catch {
      return 'indisponivel'
    }
  }, [])

  const dispensar = useCallback(() => gravarDispensada(new Date().toISOString()), [])

  return { instalado, podeSolicitar, solicitar, plataforma, dispensada, dispensar }
}
