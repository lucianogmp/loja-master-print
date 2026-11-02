// matchMedia controlável nos testes: celular × computador, movimento reduzido e app instalado.

type Midia = { mobile: boolean; reduzido: boolean; standalone: boolean }

const PADRAO: Midia = { mobile: true, reduzido: false, standalone: false }
let midia: Midia = { ...PADRAO }

function avaliar(query: string): boolean {
  if (query.includes('max-width: 767.98px')) return midia.mobile
  if (query.includes('prefers-reduced-motion: reduce')) return midia.reduzido
  if (query.includes('display-mode: standalone')) return midia.standalone
  return false
}

class ListaFake extends EventTarget implements MediaQueryList {
  matches: boolean
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null
  constructor(readonly media: string) {
    super()
    this.matches = avaliar(media)
  }
  addListener(cb: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null) {
    if (cb) this.addEventListener('change', cb as EventListener)
  }
  removeListener(cb: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null) {
    if (cb) this.removeEventListener('change', cb as EventListener)
  }
}

// Uma lista por consulta, como no navegador: dá para espiar add/removeEventListener
const listas = new Map<string, ListaFake>()

export function instalarMatchMedia() {
  window.matchMedia = (query: string) => {
    let lista = listas.get(query)
    if (!lista) listas.set(query, (lista = new ListaFake(query)))
    return lista
  }
}

/** Muda a mídia e avisa os ouvintes das consultas afetadas (evento `change`). */
export function definirMidia(parcial: Partial<Midia>) {
  midia = { ...midia, ...parcial }
  listas.forEach((lista) => {
    const agora = avaliar(lista.media)
    if (agora === lista.matches) return
    lista.matches = agora
    lista.dispatchEvent(Object.assign(new Event('change'), { matches: agora, media: lista.media }))
  })
}

export function resetarMidia() {
  midia = { ...PADRAO }
  listas.clear()
}
