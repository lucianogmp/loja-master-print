import { useSearchParams } from 'react-router-dom'

const PADRAO = '/conta'
// Telas de login e a administração nunca são destino de volta (evita laços e saída da loja)
const PROIBIDOS = /^\/(entrar|cadastro|esqueci-senha|redefinir-senha|confirme-email|admin)(?=$|[/?#])/

// Para onde levar o cliente depois do login/cadastro (ex.: /checkout).
// Só aceita caminhos internos do próprio site, para ninguém usar o link para redirecionar a outro endereço.
export function destinoSeguro(valor: string | null | undefined, padrao = PADRAO): string {
  if (!valor || valor.length > 500 || !valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\')) return padrao
  if (PROIBIDOS.test(valor)) return padrao
  return valor
}

/** `path` com `?voltar=` quando o destino é seguro e diferente do padrão. */
export function comVoltar(path: string, voltar: string | null | undefined): string {
  if (!voltar || destinoSeguro(voltar) !== voltar || voltar === PADRAO) return path
  return `${path}${path.includes('?') ? '&' : '?'}voltar=${encodeURIComponent(voltar)}`
}

export function useVoltar() {
  const [params] = useSearchParams()
  const bruto = params.get('voltar')
  const destino = destinoSeguro(bruto)
  const sufixo = bruto && destino === bruto ? `?voltar=${encodeURIComponent(bruto)}` : ''
  return { destino, sufixo }
}
