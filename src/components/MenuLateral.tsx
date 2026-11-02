import { type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import Drawer from './Drawer'
import { Link, useNavegar } from './Link'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'
import DicaInstalar from './DicaInstalar'
import { linkWhatsApp } from '../config'
import { useAuth } from '../lib/auth'
import { useCatalogo } from '../lib/catalogo'
import { useEhAdmin } from '../lib/erpAdmin'
import { useSite } from '../lib/site'
import { comVoltar } from '../lib/voltar'
import { useMenuLateral } from '../hooks/useMenuLateral'

export { useMenuLateral }

/** Menu lateral da loja (celular). Aberto pelo histórico: ver useMenuLateral. */
export default function MenuLateral({ botaoMenu }: { botaoMenu?: RefObject<HTMLElement | null> }) {
  const { aberto, fechar } = useMenuLateral()
  return (
    <Drawer aberto={aberto} onFechar={fechar} rotulo="Menu" devolverFocoPara={botaoMenu}>
      <ConteudoMenu />
    </Drawer>
  )
}

// Links do menu trocam a entrada do histórico (replace): o passo "menu aberto" não fica para trás do destino
const IR = { replace: true } as const

function ConteudoMenu() {
  const { session, carregando, sair } = useAuth()
  const { categorias, carregando: carregandoCatalogo, erro } = useCatalogo()
  const { empresa, paginas } = useSite()
  const ehAdmin = useEhAdmin()
  const navegar = useNavegar()
  const { pathname, search } = useLocation()

  const rodape = paginas.filter((p) => p.no_rodape).sort((a, b) => a.ordem - b.ordem)
  const horario = empresa.horario.trim()
  const voltar = pathname + search

  async function sairDaConta() {
    await sair()
    navegar('/', { replace: true })
  }

  return (
    <div className="drawer-corpo">
      {carregando ? (
        <div className="drawer-usuario">
          <span className="avatar avatar-m avatar-espera" aria-hidden="true" />
        </div>
      ) : session ? (
        <Link {...IR} to="/conta" className="drawer-usuario">
          <Avatar
            nome={(session.user.user_metadata as { nome?: string } | undefined)?.nome}
            email={session.user.email ?? ''}
            tamanho="m"
          />
          <span className="drawer-usuario-texto">
            <strong>{(session.user.user_metadata as { nome?: string } | undefined)?.nome || 'Minha conta'}</strong>
            <small>{session.user.email}</small>
          </span>
        </Link>
      ) : (
        <div className="drawer-usuario drawer-entrar">
          <Link {...IR} to={comVoltar('/entrar', voltar)} className="btn btn-primario">
            Entrar
          </Link>
          <Link {...IR} to={comVoltar('/cadastro', voltar)} className="btn btn-secundario">
            Criar conta
          </Link>
        </div>
      )}

      {(carregandoCatalogo || erro || categorias.length > 0) && (
        <section className="drawer-secao">
          <h2>Categorias</h2>
          {carregandoCatalogo ? (
            <p className="drawer-espera dica">Carregando categorias...</p>
          ) : erro ? (
            <p className="dica">Não foi possível carregar as categorias.</p>
          ) : (
            <ul>
              <li>
                <Link {...IR} to="/produtos">
                  Todos
                </Link>
              </li>
              {categorias.map((c) => (
                <li key={c.slug}>
                  <Link {...IR} to={`/produtos?categoria=${c.slug}`}>
                    {c.nome}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="drawer-secao">
        <h2>Loja</h2>
        <ul>
          {rodape.map((p) => (
            <li key={p.slug}>
              <Link {...IR} to={`/pagina/${p.slug}`}>
                {p.titulo}
              </Link>
            </li>
          ))}
          <li>
            <Link {...IR} to="/atendimento">
              Atendimento
            </Link>
          </li>
        </ul>
      </section>

      {(horario || empresa.whatsapp) && (
        <section className="drawer-secao drawer-atendimento">
          <h2>Atendimento</h2>
          {horario && <p>{horario}</p>}
          {empresa.whatsapp && (
            <a href={linkWhatsApp()} target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
          )}
        </section>
      )}

      <section className="drawer-secao drawer-preferencias">
        <h2>Preferências</h2>
        <div className="drawer-linha">
          <span>Tema</span>
          <ThemeToggle />
        </div>
      </section>

      <DicaInstalar variante="cartao" />

      {(ehAdmin || session) && (
        <section className="drawer-secao drawer-conta">
          {ehAdmin && (
            <Link {...IR} to="/admin" className="drawer-link">
              <Settings size={18} />
              Administração
            </Link>
          )}
          {session && (
            <button type="button" className="link-botao" onClick={sairDaConta}>
              Sair
            </button>
          )}
        </section>
      )}
    </div>
  )
}
