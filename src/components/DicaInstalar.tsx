import { useEffect, useRef, useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { useShell } from './LojaShell'
import { useInstalacao } from '../hooks/useInstalacao'

/** Convite para adicionar a loja à tela inicial: `cartao` no menu lateral, `linha` no menu da conta. Só no celular, fora do app instalado. */
export default function DicaInstalar({ variante }: { variante: 'cartao' | 'linha' }) {
  const { ehMobile } = useShell()
  const { instalado, podeSolicitar, solicitar, plataforma, dispensada, dispensar } = useInstalacao()
  const [folha, setFolha] = useState(false)
  const painel = useRef<HTMLDivElement>(null)
  const origem = useRef<HTMLElement | null>(null)

  // Folha modal: foco no "Fechar", Escape fecha e o foco volta ao botão que abriu
  useEffect(() => {
    if (!folha) return
    painel.current?.querySelector<HTMLElement>('.folha-fechar')?.focus()
    const teclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFolha(false)
    }
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('keydown', teclado)
      origem.current?.focus()
    }
  }, [folha])

  if (!ehMobile || instalado || dispensada) return null

  async function instalar() {
    if (podeSolicitar) await solicitar()
    else {
      origem.current = document.activeElement as HTMLElement | null
      setFolha(true)
    }
  }

  const conteudo =
    variante === 'cartao' ? (
      <div className="dica-instalar dica-instalar-cartao">
        <Smartphone size={22} aria-hidden="true" />
        <div className="dica-instalar-texto">
          <strong>Adicione à tela inicial</strong>
          <span className="dica">Abra a loja como um aplicativo, sem digitar o endereço.</span>
        </div>
        <div className="dica-instalar-acoes">
          <button type="button" className="btn btn-primario" onClick={instalar}>
            Adicionar
          </button>
          <button type="button" className="link-botao" onClick={dispensar}>
            Agora não
          </button>
        </div>
      </div>
    ) : (
      <li className="dica-instalar dica-instalar-linha">
        <button type="button" className="hub-linha" onClick={instalar}>
          <span>Adicionar à tela inicial</span>
          <Smartphone size={18} aria-hidden="true" />
        </button>
        <button type="button" className="link-botao" onClick={dispensar}>
          Agora não
        </button>
      </li>
    )

  return (
    <>
      {conteudo}
      {folha && (
        <>
          <div className="folha-fundo" onClick={() => setFolha(false)} aria-hidden="true" />
          <div ref={painel} className="folha-instrucoes" role="dialog" aria-modal="true" aria-label="Como adicionar à tela inicial">
            <button type="button" className="icone-botao folha-fechar" aria-label="Fechar" onClick={() => setFolha(false)}>
              <X size={20} />
            </button>
            <h2>Adicionar à tela inicial</h2>
            {plataforma === 'navegador-embutido' && <p className="dica">Abra no navegador do aparelho para instalar.</p>}
            {plataforma === 'ios' || (plataforma === 'navegador-embutido' && /iPhone|iPad|iPod/.test(navigator.userAgent)) ? (
              <ol>
                <li>Toque em Compartilhar.</li>
                <li>Escolha Adicionar à Tela de Início.</li>
              </ol>
            ) : (
              <ol>
                <li>Abra o menu do navegador.</li>
                <li>Escolha Adicionar à tela inicial.</li>
              </ol>
            )}
          </div>
        </>
      )}
    </>
  )
}
