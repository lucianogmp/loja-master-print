// Gera os ícones padrão do aplicativo (public/icones/*.png) a partir de public/favicon.svg.
// Rode `npm run icones` só quando o favicon mudar; os PNGs ficam no repositório e o build não depende disto.
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const FUNDO = '#3b82f6'
const raiz = fileURLToPath(new URL('..', import.meta.url))
const svg = await readFile(`${raiz}public/favicon.svg`)
const saida = `${raiz}public/icones/`
await mkdir(saida, { recursive: true })

// `margem` = fração de cada lado reservada (zona segura do ícone "maskable": o miolo de 80% aparece sempre)
async function icone(arquivo, tamanho, margem) {
  const miolo = Math.round(tamanho * (1 - margem * 2))
  const marca = await sharp(svg, { density: 384 }).resize(miolo, miolo).png().toBuffer()
  await sharp({ create: { width: tamanho, height: tamanho, channels: 4, background: FUNDO } })
    .composite([{ input: marca, gravity: 'centre' }])
    .png()
    .toFile(saida + arquivo)
}

await icone('icone-192.png', 192, 0.06)
await icone('icone-512.png', 512, 0.06)
await icone('icone-512-maskable.png', 512, 0.15)
await icone('icone-180.png', 180, 0.06)
console.log('Ícones gerados em public/icones')
