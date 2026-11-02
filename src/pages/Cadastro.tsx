import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavegar } from '../components/Link'
import CampoSenha from '../components/CampoSenha'
import { supabase } from '../lib/supabase'
import { erroAmigavel, MSG_SEM_CONEXAO } from '../lib/auth'
import { emailValido } from '../lib/emailValido'
import { senhaVazada, validarSenha } from '../lib/senha'
import { comVoltar, useVoltar } from '../lib/voltar'
import { useSite } from '../lib/site'
import { mascaraTelefone, so } from '../lib/enderecos'

function PoliticaLink() {
  const { paginas } = useSite()
  return paginas.some((p) => p.slug === 'privacidade') ? (
    <Link to="/pagina/privacidade" target="_blank">Política de Privacidade</Link>
  ) : (
    <>Política de Privacidade</>
  )
}

type Erros = Partial<Record<'nome' | 'email' | 'senha' | 'telefone' | 'aceite', string>>

export default function Cadastro() {
  const { destino, sufixo } = useVoltar()
  const navegar = useNavegar()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceite, setAceite] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const trava = useRef(false)

  // O DDI 55 colado ou digitado antes do DDD não entra no número guardado
  function mudarTelefone(v: string) {
    let d = so(v)
    if (d.length >= 12 && d.startsWith('55')) d = d.slice(2)
    setTelefone(d.slice(0, 11))
  }

  // Ordem das regras: nome/e-mail, senha, WhatsApp, aceite — só o primeiro grupo com problema aparece
  function validar(nomeFinal: string): Erros {
    const r: Erros = {}
    if (nomeFinal.length < 2 || nomeFinal.length > 80) r.nome = 'Informe seu nome (2 a 80 letras).'
    if (!emailValido(email)) r.email = 'Informe um e-mail válido.'
    if (r.nome || r.email) return r
    if (validarSenha(senha)) return { senha: 'A senha precisa ter 8 caracteres, com letras e números.' }
    if (telefone.length < 10) return { telefone: 'Informe um WhatsApp válido com DDD.' }
    if (!aceite) return { aceite: 'Aceite a Política de Privacidade para continuar.' }
    return {}
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (trava.current) return
    setErro('')
    const nomeFinal = nome.trim().replace(/\s+/g, ' ')
    const problemas = validar(nomeFinal)
    setErros(problemas)
    if (Object.keys(problemas).length) return
    trava.current = true
    setEnviando(true)
    try {
      if (await senhaVazada(senha)) {
        setErro('Essa senha apareceu em vazamentos. Escolha outra.')
        return
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: { nome: nomeFinal, telefone },
          emailRedirectTo: `${window.location.origin}${destino}`,
        },
      })
      if (error && !/already registered/i.test(error.message)) return setErro(erroAmigavel(error.message))
      // mesma resposta exista o e-mail ou não
      navegar(comVoltar('/confirme-email', destino), { replace: true, state: { email: email.trim() } })
    } catch {
      setErro(MSG_SEM_CONEXAO)
    } finally {
      trava.current = false
      setEnviando(false)
    }
  }

  const msg = (k: keyof Erros) => erros[k] && <span className="dica erro-campo" role="alert">{erros[k]}</span>

  return (
    <div className="container secao">
      <form className="form-checkout form-auth" onSubmit={enviar} noValidate>
        <h1 className="titulo-pagina">Criar conta</h1>
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input id="nome" autoComplete="name" value={nome} aria-invalid={!!erros.nome} onChange={(e) => setNome(e.target.value)} />
          {msg('nome')}
        </div>
        <div className="campo">
          <label htmlFor="tel">WhatsApp</label>
          <input id="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={mascaraTelefone(telefone)} aria-invalid={!!erros.telefone} onChange={(e) => mudarTelefone(e.target.value)} />
          {msg('telefone')}
        </div>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" value={email} aria-invalid={!!erros.email} onChange={(e) => setEmail(e.target.value)} />
          {msg('email')}
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <CampoSenha id="senha" autoComplete="new-password" value={senha} aria-invalid={!!erros.senha} aria-describedby="senha-dica" onChange={(e) => setSenha(e.target.value)} />
          <span className="dica" id="senha-dica">Mínimo de 8 caracteres, com letras e números</span>
          {msg('senha')}
        </div>
        <label className="radio">
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
          Aceito a <PoliticaLink /> e o uso dos meus dados para atender meus pedidos.
        </label>
        {msg('aceite')}
        {erro && <p className="dica erro-campo" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Criando...' : 'Criar conta'}</button>
        <p className="dica">Já tem conta? <Link to={`/entrar${sufixo}`}>Já tenho conta</Link></p>
      </form>
    </div>
  )
}
