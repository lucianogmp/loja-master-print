import type { Produto } from './tipos'

export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Produtos em que todas as palavras do termo aparecem (sem caixa nem acento) no nome, resumo ou descrição. */
export function buscarProdutos(produtos: Produto[], termo: string): Produto[] {
  const termos = normalizar(termo).split(/\s+/).filter(Boolean)
  return produtos.filter((p) => {
    const alvo = normalizar(`${p.nome} ${p.resumo} ${p.descricao}`)
    return termos.every((t) => alvo.includes(t))
  })
}
