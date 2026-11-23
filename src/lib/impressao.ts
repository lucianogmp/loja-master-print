// Explica o código de impressão (frente x verso) em português simples: 4 = colorido, 1 = preto e branco, 0 = sem impressão.
const LADO: Record<string, { sozinho: string; com: string }> = {
  '4': { sozinho: 'colorido', com: 'colorido' },
  '1': { sozinho: 'preto e branco', com: 'preto e branco' },
  '0': { sozinho: 'sem impressão', com: 'sem impressão' },
}

/** "4x0" → "Frente colorida, verso sem impressão." Códigos que não conhecemos não geram texto. */
export function explicarImpressao(codigo: string | undefined): string | null {
  const m = (codigo ?? '').trim().match(/^(\d)\s*[x×X]\s*(\d)$/)
  if (!m) return null
  const [, f, v] = m
  if (!LADO[f] || !LADO[v]) return null
  if (f === '0' && v === '0') return null
  const cor = (d: string, plural: boolean) =>
    d === '4' ? (plural ? 'coloridos' : 'colorida') : d === '1' ? (plural ? 'preto e branco' : 'preto e branco') : ''
  if (f === v) return `Frente e verso ${cor(f, true)}.`
  if (v === '0') return `Só a frente, ${cor(f, false)}. O verso fica sem impressão.`
  if (f === '0') return `Só o verso, ${cor(v, false)}. A frente fica sem impressão.`
  return `Frente ${cor(f, false)} e verso ${cor(v, false)}.`
}
