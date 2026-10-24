import { useSearchParams } from 'react-router-dom'

// Para onde levar o cliente depois do login/cadastro (ex.: /checkout).
// Só aceita caminhos internos do próprio site, para ninguém usar o link para redirecionar a outro endereço.
export function destinoSeguro(valor: string | null | undefined, padrao = '/conta'): string {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\')) return padrao
  return valor
}

export function useVoltar() {
  const [params] = useSearchParams()
  const bruto = params.get('voltar')
  const destino = destinoSeguro(bruto)
  const sufixo = bruto && destino === bruto ? `?voltar=${encodeURIComponent(bruto)}` : ''
  return { destino, sufixo }
}
