import { linkWhatsApp } from '../config'
import { useSite } from '../lib/site'

export default function Atendimento() {
  const { empresa } = useSite()
  return (
    <div className="container secao texto-pagina">
      <h1 className="titulo-pagina">Atendimento e informações</h1>

      <h2>Como funciona</h2>
      <ol>
        <li>Escolha o produto e as opções.</li>
        <li>Informe a quantidade ou a medida e diga como será a arte.</li>
        <li>Revise o carrinho e finalize o pedido.</li>
        <li>A gráfica confirma os detalhes com você e começa a produção.</li>
      </ol>

      <h2>Sobre a arte</h2>
      <p>
        Você pode enviar sua própria arte, pedir ajuda para criar ou usar um modelo da gráfica. Antes de
        imprimir, a equipe confere o arquivo com você.
      </p>

      <h2>Entrega e retirada</h2>
      <p>
        Você pode retirar na gráfica ou combinar a entrega. Prazo e valor do frete são confirmados no
        atendimento.
      </p>

      <h2>Fale com a gente</h2>
      <p>Atendimento: {empresa.horario}.</p>
      <a className="btn btn-primario" href={linkWhatsApp()} target="_blank" rel="noreferrer">
        Chamar no WhatsApp
      </a>
    </div>
  )
}
