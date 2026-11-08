import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from './Link'
import { useSite } from '../lib/site'
import { bannersVisiveis, destinoDoBanner, type Banner } from '../lib/banners'

function Envoltorio({ banner, temWhatsApp, children }: { banner: Banner; temWhatsApp: boolean; children: ReactNode }) {
  const d = destinoDoBanner(banner, temWhatsApp)
  if (!d) return <div className="banner-link">{children}</div>
  if ('interno' in d)
    return (
      <Link to={d.interno} className="banner-link">
        {children}
      </Link>
    )
  return (
    <a href={d.externo} className="banner-link" target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

/** Carrossel do topo da página inicial. Sem banners ativos (ou com a chave geral desligada) não renderiza nada. */
export default function BannerCarrossel() {
  const { banners, empresa } = useSite()
  const lista = bannersVisiveis(banners)
  const [atual, setAtual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const toqueX = useRef<number | null>(null)
  const n = lista.length
  const indice = n > 0 ? Math.min(atual, n - 1) : 0

  const ir = useCallback((i: number) => setAtual(((i % n) + n) % n), [n])

  // Troca sozinho, a menos que a pessoa prefira menos movimento ou esteja interagindo
  useEffect(() => {
    if (n < 2 || pausado) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      if (!document.hidden) setAtual((a) => (a + 1) % n)
    }, banners.segundos * 1000)
    return () => window.clearInterval(t)
  }, [n, pausado, banners.segundos])

  if (n === 0) return null

  return (
    <section
      className="banner-carrossel container"
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={(e) => {
        toqueX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        const x0 = toqueX.current
        toqueX.current = null
        if (x0 === null || n < 2) return
        const dx = e.changedTouches[0].clientX - x0
        if (Math.abs(dx) > 40) ir(indice + (dx < 0 ? 1 : -1))
      }}
    >
      <div className="banner-palco">
        {lista.map((b, i) => (
          <div
            key={b.id}
            className={`banner-slide${i === indice ? ' ativo' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${n}`}
            aria-hidden={i === indice ? undefined : true}
            inert={i === indice ? undefined : true}
          >
            <Envoltorio banner={b} temWhatsApp={!!empresa.whatsapp}>
              <img src={b.imagem} alt={b.alt || 'Banner'} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
            </Envoltorio>
          </div>
        ))}
        {n > 1 && (
          <>
            <button type="button" className="banner-seta banner-seta-ant" aria-label="Banner anterior" onClick={() => ir(indice - 1)}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" className="banner-seta banner-seta-prox" aria-label="Próximo banner" onClick={() => ir(indice + 1)}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="banner-pontos">
          {lista.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className={`banner-ponto${i === indice ? ' ativo' : ''}`}
              aria-label={`Ir ao banner ${i + 1}`}
              aria-current={i === indice ? 'true' : undefined}
              onClick={() => ir(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
