// Cálculo das datas comerciais no site (mesma regra do ERP: Natal, Páscoa, Dia das Mães, Black Friday...).
// Datas sempre em texto "AAAA-MM-DD" (horário local). Sem IA e sem internet.

export type RegraData = 'fixa' | 'pascoa' | 'carnaval' | 'dia_das_maes' | 'dia_dos_pais' | 'black_friday'
export type DataRegra = { regra: RegraData; mes: number | null; dia: number | null }

const pad = (n: number) => String(n).padStart(2, '0')
const montar = (a: number, m: number, d: number) => `${a}-${pad(m)}-${pad(d)}`
const paraUTC = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))

export function hojeISO(): string {
  const d = new Date()
  return montar(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function diasEntre(aISO: string, bISO: string): number {
  return Math.round((paraUTC(bISO) - paraUTC(aISO)) / 86400000)
}

export function somarDias(iso: string, n: number): string {
  const d = new Date(paraUTC(iso) + n * 86400000)
  return montar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function pascoaDoAno(ano: number): string {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return montar(ano, mes, dia)
}

/** n-ésimo dia da semana (0=domingo ... 6=sábado) de um mês. */
function enesimoDiaSemana(ano: number, mes: number, diaSemana: number, n: number): string {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay()
  const dia = 1 + ((diaSemana - primeiro + 7) % 7) + (n - 1) * 7
  return montar(ano, mes, dia)
}

/** Data em que a campanha cai num determinado ano. */
export function ocorrenciaNoAno(d: DataRegra, ano: number): string {
  switch (d.regra) {
    case 'pascoa':       return pascoaDoAno(ano)
    case 'carnaval':     return somarDias(pascoaDoAno(ano), -47)
    case 'dia_das_maes': return enesimoDiaSemana(ano, 5, 0, 2)
    case 'dia_dos_pais': return enesimoDiaSemana(ano, 8, 0, 2)
    // Black Friday = sexta depois da 4ª quinta de novembro (nem sempre é a 4ª sexta).
    case 'black_friday': return somarDias(enesimoDiaSemana(ano, 11, 4, 4), 1)
    default: {
      const mes = d.mes ?? 1
      const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
      return montar(ano, mes, Math.min(d.dia ?? 1, ultimo))
    }
  }
}

/** Próxima vez que a data acontece (hoje conta). */
export function proximaOcorrencia(d: DataRegra, hoje = hojeISO()): string {
  const ano = +hoje.slice(0, 4)
  const esteAno = ocorrenciaNoAno(d, ano)
  return esteAno >= hoje ? esteAno : ocorrenciaNoAno(d, ano + 1)
}

/** Se hoje está dentro da janela (dias antes da data), devolve a data e quantos dias faltam. */
export function janelaDaData(d: DataRegra, diasAntes: number, hoje = hojeISO()): { dataISO: string; dias: number } | null {
  const alvo = proximaOcorrencia(d, hoje)
  const dias = diasEntre(hoje, alvo)
  return dias >= 0 && dias <= diasAntes ? { dataISO: alvo, dias } : null
}

export function textoDias(dias: number): string {
  if (dias === 0) return 'É hoje!'
  if (dias === 1) return 'É amanhã!'
  return `Faltam ${dias} dias`
}
