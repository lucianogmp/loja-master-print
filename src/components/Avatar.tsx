import { corAvatar, iniciais } from '../lib/avatar'

type Props = { nome?: string | null; email: string; tamanho?: 'p' | 'm' | 'g' }

export default function Avatar({ nome, email, tamanho = 'm' }: Props) {
  const rotulo = nome?.trim() || 'Minha conta'
  const { fundo, texto } = corAvatar(nome?.trim() || email)
  return (
    <span
      className={`avatar avatar-${tamanho}`}
      role="img"
      aria-label={rotulo}
      style={{ backgroundColor: fundo, color: texto }}
    >
      <span aria-hidden="true">{iniciais(nome, email)}</span>
    </span>
  )
}
