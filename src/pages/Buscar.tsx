import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigationType, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Link, useNavegar } from '../components/Link'
import ProductCard from '../components/ProductCard'
import { useCatalogo } from '../lib/catalogo'
import { useSite } from '../lib/site'
import { linkWhatsApp } from '../config'
import { buscarProdutos } from '../lib/buscaProdutos'
import { lerRecentes, limparRecentes, salvarRecente } from '../lib/buscasRecentes'

const MAX_RESULTADOS = 8
const MAX_EXIBIDO = 100

const resumir = (t: string) => (t.length > MAX_EXIBIDO ? `${t.slice(0, MAX_EXIBIDO)}…` : t)

/** Aba Buscar: campo com foco, buscas recentes, categorias e resultados ao vivo (a partir de 2 caracteres). */
export default function Buscar() {
  const { produtos, categorias, carregando, erro, recarregar } = useCatalogo()
  const [params, setParams] = useSearchParams()
  const navegar = useNavegar()
  const tipo = useNavigationType()
  const q = params.get('q') ?? ''
  const [texto, setTexto] = useState(q)
  const [recentes, setRecentes] = useState(lerRecentes)
  const campo = useRef<HTMLInputElement>(null)
  // O termo vive em ?q=: o primeiro caractere da visita empilha uma entrada; os seguintes, inclusive após limpar, só a substituem
  const empilhou = useRef(q.trim() !== '')

  // Só ganha foco quem chega empilhando sem termo (aba/ícone); voltar do catálogo mantém o termo sem abrir o teclado.
  // (!q também cobre o instante em que o roteador ainda informa PUSH durante uma transição de tela)
  useEffect(() => {
    if (tipo === 'PUSH' && !q) campo.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Voltar/avançar muda ?q=: o campo acompanha
  useEffect(() => {
    if (q.trim() !== '') empilhou.current = true
    setTexto((atual) => (atual === q ? atual : q))
  }, [q])

  function digitar(valor: string) {
    setTexto(valor)
    const vazio = valor.trim() === ''
    const empilhar = !empilhou.current && !vazio
    if (empilhar) empilhou.current = true
    setParams(vazio ? {} : { q: valor }, { replace: !empilhar, preventScrollReset: true })
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    const termo = texto.trim()
    if (!termo) return
    setRecentes(salvarRecente(termo))
    navegar(`/produtos?busca=${encodeURIComponent(termo)}`)
  }

  const { empresa } = useSite()
  const procurando = texto.replace(/\s/g, '').length >= 2
  const achados = procurando ? buscarProdutos(produtos, texto) : []
  const termo = texto.trim()

  return (
    <div className="container buscar">
      <h1 className="titulo-pagina titulo-sub">Buscar produtos</h1>
      <form className="buscar-campo" onSubmit={enviar} role="search">
        <Search size={18} className="busca-icone" aria-hidden="true" />
        <input
          ref={campo}
          type="search"
          value={texto}
          onChange={(e) => digitar(e.target.value)}
          placeholder="Buscar produtos (ex.: banner, cartão)"
          aria-label="Buscar produtos"
          enterKeyHint="search"
        />
        {texto && (
          <button
            type="button"
            className="icone-botao"
            aria-label="Limpar busca"
            onClick={() => {
              digitar('')
              campo.current?.focus()
            }}
          >
            <X size={18} />
          </button>
        )}
      </form>

      {procurando ? (
        <section className="buscar-resultados" aria-live="polite">
          {carregando ? (
            <div className="grade-produtos">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="esqueleto card-esqueleto" />
              ))}
            </div>
          ) : erro ? (
            <p className="vazio">
              Não foi possível carregar os produtos.{' '}
              <button type="button" className="link-botao" onClick={recarregar}>
                Tentar de novo
              </button>
            </p>
          ) : achados.length === 0 ? (
            <div className="vazio buscar-nada">
              <p>Nenhum produto encontrado para "{termo}"</p>
              {empresa.whatsapp && (
                <p>
                  Não achou o que procurava?{' '}
                  <a href={linkWhatsApp(`Olá! Procurei por "${termo}" no site e não encontrei. Vocês fazem?`)} target="_blank" rel="noreferrer">
                    Perguntar no WhatsApp
                  </a>
                </p>
              )}
            </div>
          ) : (
            <>
              <ul className="grade-produtos">
                {achados.slice(0, MAX_RESULTADOS).map((p) => (
                  <li key={p.slug}>
                    <ProductCard produto={p} />
                  </li>
                ))}
              </ul>
              {achados.length > MAX_RESULTADOS && (
                <Link to={`/produtos?busca=${encodeURIComponent(termo)}`} className="btn btn-secundario btn-bloco">
                  Ver todos os resultados ({achados.length})
                </Link>
              )}
            </>
          )}
        </section>
      ) : (
        recentes.length > 0 && (
          <section className="buscar-recentes">
            <div className="buscar-topo">
              <h2>Buscas recentes</h2>
              <button
                type="button"
                className="link-botao"
                onClick={() => {
                  limparRecentes()
                  setRecentes([])
                }}
              >
                Limpar
              </button>
            </div>
            <ul>
              {recentes.map((t) => (
                <li key={t}>
                  <button type="button" title={t} onClick={() => digitar(t)}>
                    {resumir(t)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      )}

      {categorias.length > 0 && (
        <section className="buscar-categorias">
          <h2>Categorias</h2>
          <ul>
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link to={`/produtos?categoria=${c.slug}`}>{c.nome}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
