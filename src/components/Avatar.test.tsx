import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'
import { corAvatar } from '../lib/avatar'

describe('Avatar', () => {
  it('UT-093 iniciais e nome acessível', () => {
    render(<Avatar nome="Ana Souza" email="a@b.c" />)
    const avatar = screen.getByRole('img', { name: 'Ana Souza' })
    expect(avatar).toHaveTextContent('AS')
  })

  it('UT-094 sem nome → "Minha conta" e inicial do e-mail', () => {
    render(<Avatar email="bia@b.c" />)
    expect(screen.getByRole('img', { name: 'Minha conta' })).toHaveTextContent('B')
  })

  it.each(['p', 'm', 'g'] as const)('UT-095 tamanho %s → classe avatar-%s', (tamanho) => {
    render(<Avatar nome="Ana" email="a@b.c" tamanho={tamanho} />)
    expect(screen.getByRole('img')).toHaveClass(`avatar-${tamanho}`)
  })

  it('UT-096 cores vêm de corAvatar(nome)', () => {
    render(<Avatar nome="Ana Souza" email="a@b.c" />)
    const { fundo, texto } = corAvatar('Ana Souza')
    expect(screen.getByRole('img')).toHaveStyle({ backgroundColor: fundo, color: texto })
  })
})
