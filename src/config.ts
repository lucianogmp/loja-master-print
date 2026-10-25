// Valores padrão da loja. Em uso, são sobrescritos pelo que for salvo em /admin (lib/site.tsx).

export const LOJA = {
  nome: 'Master Print',
  slogan: 'Sua gráfica online',
  // WhatsApp no formato internacional, só números (ex.: 5532999999999).
  whatsapp: '5533998139539',
  horario: 'Seg a Sex, 8h às 18h',
  mensagem: 'Olá! Vim pelo site da Master Print.',
}

export function linkWhatsApp(mensagem?: string) {
  return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem ?? LOJA.mensagem)}`
}
