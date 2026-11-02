import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MensagemAtendimento from './MensagemAtendimento'
import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'

vi.mock('../lib/site', async (original) => ({ ...(await original<typeof import('../lib/site')>()), useSite: vi.fn() }))

function site(horario: string, whatsapp: string, paginasCarregadas = true) {
  vi.mocked(useSite).mockReturnValue({ empresa: { horario, whatsapp }, paginasCarregadas } as unknown as ReturnType<typeof useSite>)
}

describe('MensagemAtendimento', () => {
  beforeEach(() => vi.mocked(useSite).mockReset())

  it('UT-164 horário e link do WhatsApp', () => {
    site('Seg a sex, 8h-18h', '5533998139539')
    const { container } = render(<MensagemAtendimento />)
    const p = container.querySelector('p.mensagem-atendimento')!
    expect(p).toHaveTextContent('Seg a sex, 8h-18h')
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute('href', linkWhatsApp())
  })

  it('UT-165 sem número → só o horário', () => {
    site('Seg a sex, 8h-18h', '')
    const { container } = render(<MensagemAtendimento />)
    expect(container.querySelector('.mensagem-atendimento')).toHaveTextContent('Seg a sex, 8h-18h')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('UT-166 sem horário → só o link, com o rótulo próprio', () => {
    site('', '5533998139539')
    const { container } = render(<MensagemAtendimento />)
    expect(screen.getByRole('link', { name: 'Fale com a gente no WhatsApp' })).toBeInTheDocument()
    expect(container.querySelector('.mensagem-horario')).toBeNull()
  })

  it('UT-167 sem nada configurado → nada', () => {
    site('', '')
    expect(render(<MensagemAtendimento />).container).toBeEmptyDOMElement()
  })

  it('UT-168 configuração ainda não chegou → espaço reservado escondido', () => {
    site('', '', false)
    const { container } = render(<MensagemAtendimento />)
    const espera = container.querySelector('.mensagem-espera')!
    expect(espera).toHaveAttribute('aria-hidden', 'true')
    expect(espera).toHaveClass('mensagem-altura')
  })

  it('UT-169 configuração chegou vazia → nada (sem espaço reservado)', () => {
    site('', '', true)
    expect(render(<MensagemAtendimento />).container).toBeEmptyDOMElement()
  })

  it('UT-170 é um parágrafo comum, sem role nem título', () => {
    site('Seg a sex', '5533998139539')
    const { container } = render(<MensagemAtendimento />)
    const p = container.firstElementChild!
    expect(p.tagName).toBe('P')
    expect(p).not.toHaveAttribute('role')
    expect(p.querySelector('h1,h2,h3,h4,h5,h6')).toBeNull()
  })

  it('UT-401 não tem botão (não dá para dispensar)', () => {
    site('Seg a sex', '5533998139539')
    render(<MensagemAtendimento />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
