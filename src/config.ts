// Configurações da loja. Troque os valores de exemplo antes de publicar.

export const LOJA = {
  nome: 'Master Print',
  slogan: 'Sua gráfica online',
  // WhatsApp no formato internacional, só números (ex.: 5532999999999).
  // VALOR DE EXEMPLO — substitua pelo número real da gráfica.
  whatsapp: '5500000000000',
  horario: 'Seg a Sex, 8h às 18h',
}

export function linkWhatsApp(mensagem: string) {
  return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`
}
