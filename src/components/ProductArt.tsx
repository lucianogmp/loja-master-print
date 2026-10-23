import type { ArteTipo } from '../data/produtos'

// Ilustrações vetoriais simples, usadas como imagem de exemplo.
// Paleta tirada do ícone do ERP: azul + faixas CMYK. Serão trocadas pelas fotos reais.

const AZUL = '#1e40af'
const AZUL_MEDIO = '#1d4ed8'
const AZUL_CLARO = '#3b82f6'
const CIANO = '#06b6d4'
const MAGENTA = '#e879f9'
const AMARELO = '#facc15'
const ARDOSIA = '#334155'
const PAPEL = '#f8fafc'
const LINHA = '#94a3b8'

const CMYK = [CIANO, MAGENTA, AMARELO, ARDOSIA]

function FaixaCmyk({ x, y, largura, altura, vertical = false }: { x: number; y: number; largura: number; altura: number; vertical?: boolean }) {
  const parte = (vertical ? altura : largura) / CMYK.length
  return (
    <g>
      {CMYK.map((cor, i) => (
        <rect
          key={cor}
          x={vertical ? x : x + parte * i}
          y={vertical ? y + parte * i : y}
          width={vertical ? largura : parte}
          height={vertical ? parte : altura}
          fill={cor}
        />
      ))}
    </g>
  )
}

export default function ProductArt({ tipo, className }: { tipo: ArteTipo; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      role="img"
      aria-label="Ilustração de exemplo do produto"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" style={{ fill: 'var(--art-bg)' }} />
      <circle cx="320" cy="60" r="110" fill={AZUL_CLARO} opacity="0.1" />

      {tipo === 'cartao' && (
        <g>
          <rect x="95" y="95" width="210" height="120" rx="8" fill="#000" opacity=".25" transform="translate(8 10)" />
          <rect x="95" y="95" width="210" height="120" rx="8" fill={AZUL} />
          <FaixaCmyk x={95} y={95} largura={10} altura={120} vertical />
          <rect x="130" y="125" width="90" height="10" rx="3" fill={PAPEL} />
          <rect x="130" y="148" width="130" height="6" rx="3" fill={PAPEL} opacity=".7" />
          <rect x="130" y="164" width="110" height="6" rx="3" fill={PAPEL} opacity=".5" />
          <rect x="130" y="180" width="80" height="6" rx="3" fill={PAPEL} opacity=".5" />
        </g>
      )}

      {tipo === 'adesivo' && (
        <g>
          <circle cx="160" cy="150" r="70" fill={PAPEL} />
          <circle cx="160" cy="150" r="52" fill={AZUL_MEDIO} />
          <path d="M138 150 l16 16 l30 -34" stroke={AMARELO} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="235" y="95" width="100" height="100" rx="14" fill={CIANO} transform="rotate(8 285 145)" />
          <path d="M335 175 l-30 30 v-30z" fill={PAPEL} opacity=".7" />
        </g>
      )}

      {tipo === 'banner' && (
        <g>
          <rect x="60" y="70" width="280" height="130" rx="4" fill={AZUL} />
          <FaixaCmyk x={60} y={70} largura={280} altura={12} />
          <rect x="85" y="105" width="140" height="14" rx="3" fill={PAPEL} />
          <rect x="85" y="130" width="190" height="8" rx="3" fill={PAPEL} opacity=".6" />
          <rect x="85" y="148" width="160" height="8" rx="3" fill={PAPEL} opacity=".6" />
          <rect x="85" y="170" width="70" height="18" rx="4" fill={AZUL_CLARO} />
          <circle cx="68" cy="90" r="3.5" fill={PAPEL} />
          <circle cx="332" cy="90" r="3.5" fill={PAPEL} />
          <circle cx="68" cy="192" r="3.5" fill={PAPEL} />
          <circle cx="332" cy="192" r="3.5" fill={PAPEL} />
        </g>
      )}

      {tipo === 'impresso' && (
        <g transform="rotate(-4 180 150)">
          <rect x="105" y="55" width="150" height="195" rx="4" fill="#000" opacity=".25" transform="translate(10 8)" />
          <rect x="105" y="55" width="150" height="195" rx="4" fill={PAPEL} />
          <rect x="105" y="55" width="150" height="62" rx="4" fill={AZUL} />
          <rect x="105" y="105" width="150" height="12" fill={AZUL} />
          <rect x="122" y="75" width="80" height="10" rx="3" fill={PAPEL} />
          <rect x="122" y="94" width="104" height="6" rx="3" fill={PAPEL} opacity=".7" />
          <rect x="122" y="135" width="116" height="6" rx="3" fill={LINHA} />
          <rect x="122" y="150" width="100" height="6" rx="3" fill={LINHA} />
          <rect x="122" y="165" width="110" height="6" rx="3" fill={LINHA} />
          <FaixaCmyk x={122} y={205} largura={62} altura={14} />
        </g>
      )}

      {tipo === 'placa' && (
        <g>
          <rect x="70" y="80" width="260" height="120" rx="10" fill="#000" opacity=".25" transform="translate(7 9)" />
          <rect x="70" y="80" width="260" height="120" rx="10" fill={PAPEL} />
          <rect x="84" y="94" width="232" height="92" rx="6" fill={AZUL} />
          <circle cx="132" cy="140" r="26" fill={AZUL_CLARO} />
          <circle cx="132" cy="140" r="12" fill={AMARELO} />
          <rect x="172" y="122" width="116" height="12" rx="3" fill={PAPEL} />
          <rect x="172" y="146" width="84" height="8" rx="3" fill={PAPEL} opacity=".65" />
          <circle cx="82" cy="92" r="3" fill={LINHA} />
          <circle cx="318" cy="92" r="3" fill={LINHA} />
          <circle cx="82" cy="188" r="3" fill={LINHA} />
          <circle cx="318" cy="188" r="3" fill={LINHA} />
        </g>
      )}

      {tipo === 'quadro' && (
        <g>
          <rect x="115" y="50" width="170" height="200" fill="#000" opacity=".25" transform="translate(9 9)" />
          <rect x="115" y="50" width="170" height="200" fill={ARDOSIA} />
          <rect x="127" y="62" width="146" height="176" fill={PAPEL} />
          <rect x="137" y="72" width="126" height="156" fill="#dbeafe" />
          <circle cx="225" cy="115" r="18" fill={AMARELO} />
          <path d="M137 228 V170 l36 -34 l34 30 l22 -18 l34 30 V228z" fill={AZUL_CLARO} />
          <path d="M137 228 V195 l44 -26 l50 34 l32 -14 V228z" fill={AZUL} />
        </g>
      )}
    </svg>
  )
}
