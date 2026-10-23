// Regras de senha + checagem de vazamento (Have I Been Pwned, k-anonymity:
// só os 5 primeiros caracteres do hash saem do navegador; a senha nunca é enviada).
export function validarSenha(s: string): string | null {
  if (s.length < 8) return 'Use pelo menos 8 caracteres.'
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return 'A senha precisa ter letras e números.'
  return null
}

export async function senhaVazada(s: string): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s))
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } })
    if (!res.ok) return false
    const texto = await res.text()
    return texto.split('\n').some((l) => {
      const [suf, qtd] = l.trim().split(':')
      return suf === hex.slice(5) && Number(qtd) > 0
    })
  } catch {
    return false // se o serviço estiver fora, não trava o cadastro
  }
}
