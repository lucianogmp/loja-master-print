// Avatar de letras: iniciais do nome (ou do e-mail) sobre uma cor fixa escolhida pelo próprio nome.

/** Pares fundo/texto com contraste de pelo menos 4,5:1. */
export const PALETA_AVATAR: { fundo: string; texto: string }[] = [
  { fundo: '#1d4ed8', texto: '#ffffff' },
  { fundo: '#b91c1c', texto: '#ffffff' },
  { fundo: '#047857', texto: '#ffffff' },
  { fundo: '#7e22ce', texto: '#ffffff' },
  { fundo: '#c2410c', texto: '#ffffff' },
  { fundo: '#0f766e', texto: '#ffffff' },
  { fundo: '#be185d', texto: '#ffffff' },
  { fundo: '#4338ca', texto: '#ffffff' },
]

const primeiraLetra = (palavra: string) => palavra.match(/\p{L}/u)?.[0] ?? ''

export function iniciais(nome: string | null | undefined, email: string): string {
  const palavras = (nome ?? '').split(/\s+/).filter((p) => primeiraLetra(p))
  if (palavras.length === 0) return primeiraLetra(email).toUpperCase()
  const primeira = primeiraLetra(palavras[0])
  const ultima = palavras.length > 1 ? primeiraLetra(palavras[palavras.length - 1]) : ''
  return (primeira + ultima).toUpperCase()
}

export function corAvatar(semente: string): { fundo: string; texto: string } {
  let h = 0
  for (const c of semente) h = (h * 31 + c.codePointAt(0)!) >>> 0
  return PALETA_AVATAR[h % PALETA_AVATAR.length]
}
