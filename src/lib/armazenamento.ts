// JSON no localStorage sem nunca derrubar a tela: armazenamento indisponível, conteúdo corrompido
// ou de outra versão contam como "nada salvo".

type Envelope = { v: number }

export function lerJson<T>(chave: string, versao: number): T | null {
  try {
    const bruto = localStorage.getItem(chave)
    if (bruto === null) return null
    const valor = JSON.parse(bruto) as Envelope
    if (!valor || typeof valor !== 'object' || valor.v !== versao) {
      localStorage.removeItem(chave)
      return null
    }
    const { v: _v, ...dados } = valor
    return dados as T
  } catch {
    return null
  }
}

/** Grava `{ v: versao, ...valor }` (valores que não são objeto ficam em `valor`). Devolve false quando não foi possível gravar. */
export function gravarJson(chave: string, versao: number, valor: unknown): boolean {
  try {
    const objeto = valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : { valor }
    localStorage.setItem(chave, JSON.stringify({ v: versao, ...objeto }))
    return true
  } catch {
    return false
  }
}

export function removerChaves(prefixo: string): void {
  try {
    const chaves: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefixo)) chaves.push(k)
    }
    chaves.forEach((k) => localStorage.removeItem(k))
  } catch {
    // sem armazenamento: nada a remover
  }
}
