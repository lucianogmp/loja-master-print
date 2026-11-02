import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderComTudo } from '../test/render'
import { fetchErp, logada, respostaJson } from '../test/dados'
import { instalarTabelas, sessaoFake, supabaseFake, usou, type ChamadaTabela } from '../test/fakes'

afterEach(() => vi.restoreAllMocks())

const linhaEndereco = (i: number, padrao = false) => ({
  id: `e${i}`,
  apelido: null,
  destinatario: `Pessoa ${i}`,
  telefone: '33999990000',
  cep: '39800000',
  rua: 'Rua A',
  numero: String(i),
  complemento: null,
  bairro: 'Centro',
  cidade: 'Teófilo Otoni',
  uf: 'MG',
  padrao,
})
const enderecos = (n: number) => Array.from({ length: n }, (_, i) => linhaEndereco(i + 1, i === 0))

/** Tabelas com endereços dados; `sobre` troca a resposta de uma operação (ex.: update, delete). */
function tabelas(lista: unknown[], sobre: (c: ChamadaTabela) => { data?: unknown; error?: unknown } | undefined = () => undefined) {
  return instalarTabelas((c) => {
    const trocada = sobre(c)
    if (trocada) return { data: trocada.data ?? null, error: trocada.error ?? null }
    if (c.tabela === 'enderecos') return { data: lista, error: null }
    return { data: { nome: 'Ana Souza', telefone: '33999990000' }, error: null }
  })
}
const operacao = (c: ChamadaTabela, ...nomes: string[]) => c.metodos.some((m) => nomes.includes(m.nome))

const confirmar = (valor = true) => vi.spyOn(window, 'confirm').mockReturnValue(valor)

describe('Endereços', () => {
  it('UT-310 cinco endereços: sem botão de adicionar e com o aviso do limite', async () => {
    tabelas(enderecos(5))
    renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    expect(await screen.findByText('Limite de 5 endereços. Exclua um para adicionar outro.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adicionar endereço' })).toBeNull()
  })

  it('UT-311 quatro endereços: botão presente', async () => {
    tabelas(enderecos(4))
    renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    expect(await screen.findByRole('button', { name: 'Adicionar endereço' })).toBeInTheDocument()
    expect(screen.queryByText(/Limite de 5/)).toBeNull()
  })

  it('UT-319 excluir o padrão passa o padrão ao próximo', async () => {
    confirmar()
    const chamadas = tabelas(enderecos(2))
    const { usuario } = renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await screen.findByText('Pessoa 2')
    await usuario.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    await waitFor(() => expect(usou(chamadas, 'enderecos', 'update')).toHaveLength(1))
    const [alteracao] = usou(chamadas, 'enderecos', 'update')
    expect(alteracao.metodos.find((m) => m.nome === 'update')?.args).toEqual([{ padrao: true }])
    expect(alteracao.metodos.find((m) => m.nome === 'eq')?.args).toEqual(['id', 'e2'])
  })

  it('UT-388 sem endereços: orientação e botão de adicionar', async () => {
    tabelas([])
    renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    expect(await screen.findByText(/Você ainda não salvou endereços/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar endereço' })).toBeInTheDocument()
  })

  it('UT-389 CEP não encontrado: campos livres e aviso para completar à mão', async () => {
    tabelas([])
    fetchErp({ 'json/': () => respostaJson({ erro: true }) })
    const { usuario } = renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar endereço' }))
    await usuario.type(screen.getByLabelText('CEP'), '39800000')
    expect(await screen.findByText(/Preencha o endereço à mão/)).toBeInTheDocument()
    await usuario.type(screen.getByLabelText('Rua / avenida'), 'Rua B')
    expect(screen.getByLabelText('Rua / avenida')).toHaveValue('Rua B')
  })

  it('UT-390 duplo clique em Excluir apaga uma vez', async () => {
    confirmar()
    let liberar!: () => void
    const segurada = new Promise<{ data: unknown; error: unknown }>((ok) => (liberar = () => ok({ data: null, error: null })))
    const chamadas = instalarTabelas((c) => (operacao(c, 'delete') ? segurada : { data: c.tabela === 'enderecos' ? enderecos(2) : {}, error: null }))
    const { usuario } = renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await screen.findByText('Pessoa 2')
    await usuario.dblClick(screen.getAllByRole('button', { name: 'Excluir' })[1])
    liberar()
    await screen.findByText('Endereço excluído.')
    expect(chamadas.filter((c) => operacao(c, 'delete'))).toHaveLength(1)
  })

  it('UT-391 editar um endereço que não existe mais: "Endereço não encontrado"', async () => {
    tabelas(enderecos(1), (c) => (operacao(c, 'update') ? { data: [] } : undefined))
    const { usuario } = renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Editar' }))
    await usuario.click(screen.getByRole('button', { name: 'Salvar endereço' }))
    expect(await screen.findByText('Endereço não encontrado.')).toBeInTheDocument()
  })

  it('UT-391 (erro do servidor) também diz "Endereço não encontrado"', async () => {
    tabelas(enderecos(1), (c) => (operacao(c, 'update') ? { error: { message: 'x' } } : undefined))
    const { usuario } = renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Editar' }))
    await usuario.click(screen.getByRole('button', { name: 'Salvar endereço' }))
    expect(await screen.findByText('Endereço não encontrado.')).toBeInTheDocument()
  })

  it('IT-013 sessão vencida ao salvar endereço: aviso de sessão no lugar', async () => {
    tabelas(enderecos(1), (c) => (operacao(c, 'update') ? { error: { status: 401, message: 'JWT expired' } } : undefined))
    const { usuario } = renderComTudo({ rota: '/conta/enderecos' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Editar' }))
    await usuario.click(screen.getByRole('button', { name: 'Salvar endereço' }))
    expect(await screen.findByRole('heading', { name: 'Sua sessão expirou. Entre novamente.' })).toBeInTheDocument()
  })
})

async function sha1(texto: string) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(texto))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

describe('Segurança', () => {
  const preencher = async (usuario: ReturnType<typeof renderComTudo>['usuario'], nova: string, repetir: string) => {
    await usuario.type(await screen.findByLabelText('Nova senha'), nova)
    await usuario.type(screen.getByLabelText('Repetir a nova senha'), repetir)
    await usuario.click(screen.getByRole('button', { name: 'Trocar senha' }))
  }

  it('UT-312 dois campos de senha com mostrar/ocultar; senhas diferentes → aviso e nada enviado', async () => {
    const { usuario, container } = renderComTudo({ rota: '/conta/seguranca' }, { sessao: logada() })
    await screen.findByLabelText('Nova senha')
    expect(container.querySelectorAll('.campo-senha')).toHaveLength(2)
    await preencher(usuario, 'abcdefg1', 'abcdefg2')
    expect(await screen.findByText('As senhas não coincidem.')).toBeInTheDocument()
    expect(supabaseFake.auth.updateUser).not.toHaveBeenCalled()
  })

  it('UT-313 senha válida → updateUser e "Senha alterada."', async () => {
    const { usuario } = renderComTudo({ rota: '/conta/seguranca' }, { sessao: logada() })
    await preencher(usuario, 'abcdefg1', 'abcdefg1')
    expect(await screen.findByText('Senha alterada.')).toBeInTheDocument()
    expect(supabaseFake.auth.updateUser).toHaveBeenCalledWith({ password: 'abcdefg1' })
  })

  it('UT-314 sair de todos os aparelhos falhou: mensagem e a sessão continua', async () => {
    confirmar()
    supabaseFake.auth.signOut.mockRejectedValueOnce(new Error('sem rede'))
    const { usuario, router } = renderComTudo({ rota: '/conta/seguranca' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Sair de todos os aparelhos' }))
    expect(await screen.findByText(/Não foi possível sair dos outros aparelhos/)).toBeInTheDocument()
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
    expect(router.state.location.pathname).toBe('/conta/seguranca')
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
  })

  it('sair de todos os aparelhos com sucesso abre o início', async () => {
    confirmar()
    const { usuario, router } = renderComTudo({ rota: '/conta/seguranca' }, { sessao: logada() })
    await usuario.click(await screen.findByRole('button', { name: 'Sair de todos os aparelhos' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('UT-392 senha em vazamento: mensagem e nada enviado', async () => {
    const hash = await sha1('abcdefg1')
    fetchErp({ [hash.slice(0, 5)]: () => new Response(`${hash.slice(5)}:42\n`, { status: 200 }) })
    const { usuario } = renderComTudo({ rota: '/conta/seguranca' }, { sessao: logada() })
    await preencher(usuario, 'abcdefg1', 'abcdefg1')
    expect(await screen.findByText(/já apareceu em vazamentos/)).toBeInTheDocument()
    expect(supabaseFake.auth.updateUser).not.toHaveBeenCalled()
  })
})

describe('Meus dados', () => {
  const abrir = () => renderComTudo({ rota: '/conta/dados' }, { sessao: logada() })
  const campos = async () => {
    const nome = await screen.findByLabelText('Nome')
    await waitFor(() => expect(nome).toHaveValue('Ana Souza'))
    return { nome, tel: screen.getByLabelText('WhatsApp') }
  }

  it('UT-315 salvar grava o perfil e atualiza o login', async () => {
    const chamadas = tabelas([])
    const { usuario } = abrir()
    const { nome } = await campos()
    await usuario.clear(nome)
    await usuario.type(nome, 'Bia Lima')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument()
    const [upsert] = usou(chamadas, 'perfis', 'upsert')
    expect(upsert.metodos.find((m) => m.nome === 'upsert')?.args).toEqual([{ id: 'u1', nome: 'Bia Lima', telefone: '33999990000' }])
    expect(supabaseFake.auth.updateUser).toHaveBeenCalledWith({ data: { nome: 'Bia Lima', telefone: '33999990000' } })
  })

  it('UT-316 nome curto e WhatsApp incompleto: avisos e nenhuma chamada', async () => {
    const chamadas = tabelas([])
    const { usuario } = abrir()
    const { nome, tel } = await campos()
    await usuario.clear(nome)
    await usuario.type(nome, 'A')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()
    await usuario.clear(nome)
    await usuario.type(nome, 'Ana')
    await usuario.clear(tel)
    await usuario.type(tel, '339999900')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Informe o WhatsApp com DDD.')).toBeInTheDocument()
    expect(usou(chamadas, 'perfis', 'upsert')).toHaveLength(0)
    expect(supabaseFake.auth.updateUser).not.toHaveBeenCalled()
  })

  it('UT-386 falha ao gravar: mensagem e os valores digitados continuam', async () => {
    tabelas([], (c) => (operacao(c, 'upsert') ? { error: { message: 'x' } } : undefined))
    const { usuario } = abrir()
    const { nome } = await campos()
    await usuario.clear(nome)
    await usuario.type(nome, 'Bia Lima')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Não foi possível salvar.')).toBeInTheDocument()
    expect(nome).toHaveValue('Bia Lima')
    expect(supabaseFake.auth.updateUser).not.toHaveBeenCalled()
  })

  it('UT-387 duplo clique em Salvar grava uma vez', async () => {
    let liberar!: () => void
    const segurada = new Promise<{ data: unknown; error: unknown }>((ok) => (liberar = () => ok({ data: null, error: null })))
    const chamadas = instalarTabelas((c) => (operacao(c, 'upsert') ? segurada : { data: c.tabela === 'enderecos' ? [] : { nome: 'Ana Souza', telefone: '33999990000' }, error: null }))
    const { usuario } = abrir()
    await campos()
    await usuario.dblClick(screen.getByRole('button', { name: 'Salvar' }))
    liberar()
    await screen.findByText('Dados salvos.')
    expect(usou(chamadas, 'perfis', 'upsert')).toHaveLength(1)
  })

  it('IT-013 sessão vencida ao salvar: aviso de sessão no lugar da tela', async () => {
    tabelas([], (c) => (operacao(c, 'upsert') ? { error: { status: 401, message: 'JWT expired' } } : undefined))
    const { usuario } = abrir()
    await campos()
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('heading', { name: 'Sua sessão expirou. Entre novamente.' })).toBeInTheDocument()
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})

describe('Privacidade', () => {
  const abrir = () => renderComTudo({ rota: '/conta/privacidade' }, { sessao: sessaoFake({ email: 'a@b.c', nome: 'Ana Souza' }) })

  it('UT-317 e-mail com espaços e maiúsculas libera a exclusão', async () => {
    const { usuario } = abrir()
    await usuario.click(await screen.findByRole('button', { name: 'Excluir minha conta' }))
    const excluir = screen.getByRole('button', { name: 'Excluir definitivamente' })
    expect(excluir).toBeDisabled()
    await usuario.type(screen.getByLabelText('Para confirmar, digite seu e-mail'), ' A@B.C ')
    expect(excluir).toBeEnabled()
  })

  it('UT-318 avisa que os pedidos continuam com a gráfica', async () => {
    abrir()
    const texto = await screen.findByText(/Os pedidos já feitos continuam registrados/)
    expect(texto.textContent).toMatch(/pedidos/)
    expect(texto.textContent).toMatch(/gráfica/)
  })

  it('UT-393 falha ao excluir a conta: mensagem e a sessão continua', async () => {
    supabaseFake.functions.invoke.mockResolvedValueOnce({ data: null, error: { message: 'x' } })
    const { usuario, router } = abrir()
    await usuario.click(await screen.findByRole('button', { name: 'Excluir minha conta' }))
    await usuario.type(screen.getByLabelText('Para confirmar, digite seu e-mail'), 'a@b.c')
    await usuario.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))
    expect(await screen.findByText(/Não foi possível excluir a conta agora/)).toBeInTheDocument()
    expect(supabaseFake.auth.signOut).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/conta/privacidade')
  })

  it('conta excluída: sai, abre o início e avisa "Conta excluída"', async () => {
    const { usuario, router } = abrir()
    await usuario.click(await screen.findByRole('button', { name: 'Excluir minha conta' }))
    await usuario.type(screen.getByLabelText('Para confirmar, digite seu e-mail'), 'a@b.c')
    await usuario.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Conta excluída')).toBeInTheDocument()
  })
})
