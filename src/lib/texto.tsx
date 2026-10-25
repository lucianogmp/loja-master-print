import type { ReactNode } from 'react'

// Mostra o texto das páginas escrito na administração. Formato simples e seguro (nunca HTML):
//   ## Título        -> subtítulo
//   - item           -> lista
//   **negrito**      -> negrito
//   [texto](https://endereço) -> link (só http, https e mailto)
//   linha em branco  -> novo parágrafo

const LINK_OK = /^(https?:\/\/|mailto:)/i

function linha(texto: string, chave: string): ReactNode[] {
  const saida: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let ultimo = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) saida.push(texto.slice(ultimo, m.index))
    if (m[1] !== undefined) saida.push(<strong key={`${chave}-${i}`}>{m[1]}</strong>)
    else if (LINK_OK.test(m[3]))
      saida.push(
        <a key={`${chave}-${i}`} href={m[3]} target="_blank" rel="noreferrer noopener">
          {m[2]}
        </a>,
      )
    else saida.push(m[0])
    ultimo = m.index + m[0].length
    i++
  }
  if (ultimo < texto.length) saida.push(texto.slice(ultimo))
  return saida
}

export default function TextoFormatado({ texto }: { texto: string }) {
  const blocos: ReactNode[] = []
  let paragrafo: string[] = []
  let itens: string[] = []

  const fechar = () => {
    if (paragrafo.length) {
      const k = blocos.length
      blocos.push(
        <p key={k}>
          {paragrafo.flatMap((l, i) => [...(i ? [<br key={`br${i}`} />] : []), ...linha(l, `p${k}-${i}`)])}
        </p>,
      )
      paragrafo = []
    }
    if (itens.length) {
      const k = blocos.length
      blocos.push(
        <ul key={k}>
          {itens.map((t, i) => (
            <li key={i}>{linha(t, `l${k}-${i}`)}</li>
          ))}
        </ul>,
      )
      itens = []
    }
  }

  for (const bruta of texto.replace(/\r/g, '').split('\n')) {
    const l = bruta.trimEnd()
    if (!l.trim()) fechar()
    else if (l.startsWith('## ')) {
      fechar()
      blocos.push(<h2 key={blocos.length}>{linha(l.slice(3), `h${blocos.length}`)}</h2>)
    } else if (/^[-*] /.test(l)) {
      if (paragrafo.length) fechar()
      itens.push(l.slice(2))
    } else {
      if (itens.length) fechar()
      paragrafo.push(l)
    }
  }
  fechar()
  return <>{blocos}</>
}
