export const brl = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** "1 dia útil", "3 dias úteis". */
export const diasUteis = (n: number) => (n === 1 ? '1 dia útil' : `${n} dias úteis`)
