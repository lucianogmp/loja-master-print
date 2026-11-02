import { gravarJson, lerJson } from './armazenamento'

// Termos buscados por último na tela Buscar (só os enviados com Enter), no navegador.

const CHAVE = 'loja-buscas-recentes'
const VERSAO = 1
const MAXIMO = 5

export function lerRecentes(): string[] {
  const dados = lerJson<{ termos?: unknown }>(CHAVE, VERSAO)
  return Array.isArray(dados?.termos) ? dados.termos.filter((t): t is string => typeof t === 'string') : []
}

/** Põe o termo no topo (sem duplicar, ignorando caixa) e mantém só os cinco mais recentes. Devolve a lista. */
export function salvarRecente(termo: string): string[] {
  const atual = lerRecentes()
  const limpo = termo.trim()
  if (!limpo) return atual
  const chave = limpo.toLowerCase()
  const existente = atual.find((t) => t.toLowerCase() === chave)
  const lista = [existente ?? limpo, ...atual.filter((t) => t.toLowerCase() !== chave)].slice(0, MAXIMO)
  return gravarJson(CHAVE, VERSAO, { termos: lista }) ? lista : []
}

export function limparRecentes(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // sem armazenamento: nada a limpar
  }
}
