// Manifesto do aplicativo (PWA): nome, cores e ícone vêm do que está salvo em /admin.
const URL_ERP = process.env.VITE_ERP_URL || 'https://qrgdcyceqsrtmerqazgp.supabase.co'
const CHAVE = process.env.VITE_ERP_ANON_KEY || 'sb_publishable_ibl32QMcmkNbPQJU5C6g4Q_u7CuXpeV'

export default async function handler(req, res) {
  let cfg = {}
  try {
    const r = await fetch(`${URL_ERP}/rest/v1/rpc/loja_config`, {
      method: 'POST',
      headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (r.ok) cfg = await r.json()
  } catch {
    // sem resposta do banco: usa os padrões
  }
  const emp = cfg.empresa ?? {}
  const apa = cfg.aparencia ?? {}
  const nome = String(emp.nome || 'Master Print')
  const cor = /^#[0-9a-f]{6}$/i.test(apa.cor || '') ? apa.cor : '#3b82f6'
  const icone = typeof apa.iconeApp === 'string' && apa.iconeApp ? apa.iconeApp : ''
  const icones = icone
    ? [
        { src: icone, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: icone, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ]
    : [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600')
  res.status(200).send(
    JSON.stringify({
      name: nome,
      short_name: nome.slice(0, 12),
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0c0d16',
      theme_color: cor,
      icons: icones,
    }),
  )
}
