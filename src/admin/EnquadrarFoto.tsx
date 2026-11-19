import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

// Janelinha para enquadrar a foto em quadrado antes de enviar (como foto de perfil de rede social).
// Arraste para mover, use o zoom e escolha entre "Preencher" (corta as bordas) e "Inteira" (fundo branco).
const SAIDA = 1000

type Props = { arquivo: File; aoConfirmar: (f: File) => void; aoCancelar: () => void }

function Enquadrar({ arquivo, aoConfirmar, aoCancelar }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [url] = useState(() => URL.createObjectURL(arquivo))
  const [modo, setModo] = useState<'preencher' | 'inteira'>('preencher')
  const [zoom, setZoom] = useState(1)
  const [c, setC] = useState({ x: 0, y: 0 }) // deslocamento do centro da foto em relação ao centro do quadro
  const [lado, setLado] = useState(320)
  const quadro = useRef<HTMLDivElement>(null)
  const arrasto = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null)

  useEffect(() => {
    const i = new Image()
    i.onload = () => {
      setImg(i)
      // foto já quadrada: começa "inteira" só para confirmar sem corte
      if (Math.abs(i.naturalWidth - i.naturalHeight) <= 2) setModo('inteira')
    }
    i.src = url
    return () => URL.revokeObjectURL(url)
  }, [url])

  useEffect(() => {
    const medir = () => quadro.current && setLado(quadro.current.clientWidth)
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoCancelar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aoCancelar])

  const w = img?.naturalWidth ?? 1
  const h = img?.naturalHeight ?? 1
  const base = modo === 'preencher' ? Math.max(lado / w, lado / h) : Math.min(lado / w, lado / h)
  const escala = base * zoom
  const quadrada = img ? Math.abs(w - h) <= 2 : false

  const limitar = (x: number, y: number) => {
    const mx = Math.abs(w * escala - lado) / 2
    const my = Math.abs(h * escala - lado) / 2
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) }
  }
  // reenquadra quando muda modo/zoom (mantém dentro dos limites)
  useEffect(() => {
    setC((p) => limitar(p.x, p.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, zoom, lado, img])

  function aoApertar(e: React.PointerEvent) {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    arrasto.current = { px: e.clientX, py: e.clientY, cx: c.x, cy: c.y }
  }
  function aoMover(e: React.PointerEvent) {
    const a = arrasto.current
    if (!a) return
    setC(limitar(a.cx + e.clientX - a.px, a.cy + e.clientY - a.py))
  }

  function confirmar() {
    if (!img) return
    const cv = document.createElement('canvas')
    cv.width = SAIDA
    cv.height = SAIDA
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, SAIDA, SAIDA)
    const k = SAIDA / lado
    const dw = w * escala * k
    const dh = h * escala * k
    ctx.drawImage(img, SAIDA / 2 - dw / 2 + c.x * k, SAIDA / 2 - dh / 2 + c.y * k, dw, dh)
    cv.toBlob((b) => {
      if (!b) return aoCancelar()
      const nome = arquivo.name.replace(/\.[^.]+$/, '') || 'foto'
      aoConfirmar(new File([b], `${nome}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="enq-fundo" role="dialog" aria-modal="true" aria-label="Ajustar foto">
      <div className="enq-caixa">
        <h3>Ajustar foto</h3>
        <p className="dica">{quadrada ? 'A foto já é quadrada. Confirme ou ajuste.' : 'Arraste para posicionar e use o zoom. A foto fica quadrada.'}</p>
        <div
          ref={quadro}
          className="enq-quadro"
          onPointerDown={aoApertar}
          onPointerMove={aoMover}
          onPointerUp={() => (arrasto.current = null)}
          onPointerCancel={() => (arrasto.current = null)}
        >
          {img && (
            <img
              src={url}
              alt=""
              draggable={false}
              style={{ width: w * escala, height: h * escala, transform: `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px))` }}
            />
          )}
        </div>
        <div className="enq-linha">
          <button type="button" className={`btn btn-secundario${modo === 'preencher' ? ' ativo' : ''}`} onClick={() => { setModo('preencher'); setZoom(1) }}>Preencher</button>
          <button type="button" className={`btn btn-secundario${modo === 'inteira' ? ' ativo' : ''}`} onClick={() => { setModo('inteira'); setZoom(1) }}>Inteira (fundo branco)</button>
        </div>
        <label className="enq-zoom">
          Zoom
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <div className="enq-linha">
          <button type="button" className="btn btn-primario" onClick={confirmar} disabled={!img}>Usar esta foto</button>
          <button type="button" className="btn btn-secundario" onClick={aoCancelar}>Pular foto</button>
        </div>
      </div>
    </div>
  )
}

/** Abre a janela de enquadramento. Devolve a foto quadrada (JPG 1000x1000) ou null se pular. */
export function enquadrarFoto(arquivo: File): Promise<File | null> {
  return new Promise((resolver) => {
    const no = document.createElement('div')
    document.body.appendChild(no)
    const raiz = createRoot(no)
    const fechar = (r: File | null) => {
      raiz.unmount()
      no.remove()
      resolver(r)
    }
    raiz.render(<Enquadrar arquivo={arquivo} aoConfirmar={fechar} aoCancelar={() => fechar(null)} />)
  })
}

/** Reabre uma foto que já está no site para enquadrar de novo. Devolve o novo arquivo, null se cancelar; lança erro se não conseguir baixar. */
export async function enquadrarFotoExistente(url: string): Promise<File | null> {
  const r = await fetch(url)
  if (!r.ok) throw new Error('download')
  const b = await r.blob()
  return enquadrarFoto(new File([b], 'foto.jpg', { type: b.type || 'image/jpeg' }))
}
