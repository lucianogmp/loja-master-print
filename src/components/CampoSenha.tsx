import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Campo de senha com botão de mostrar/ocultar; repassa os atributos ao `input`. */
export default function CampoSenha(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="campo-senha">
      <input {...props} type={visivel ? 'text' : 'password'} />
      <button
        type="button"
        className="icone-botao"
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisivel((v) => !v)}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
