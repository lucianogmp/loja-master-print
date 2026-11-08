import { describe, expect, it } from 'vitest'
import { bannersVisiveis, destinoDoBanner, normalizarBanners } from './banners'

describe('banners', () => {
  it('normaliza configuração ausente: ligado, sem itens', () => {
    expect(normalizarBanners(undefined)).toEqual({ ativo: true, segundos: 5, itens: [] })
  })

  it('chave geral desligada esconde todos; banner desligado ou sem imagem também some', () => {
    const b = normalizarBanners({
      ativo: true,
      itens: [
        { id: 'a', imagem: 'x.jpg' },
        { id: 'b', imagem: 'y.jpg', ativo: false },
        { id: 'c', imagem: '' },
      ],
    })
    expect(bannersVisiveis(b).map((x) => x.id)).toEqual(['a'])
    expect(bannersVisiveis({ ...b, ativo: false })).toEqual([])
  })

  it('destinos de cada tipo de link', () => {
    expect(destinoDoBanner({ tipo: 'nenhum', destino: '' })).toBeNull()
    expect(destinoDoBanner({ tipo: 'produto', destino: 'cartao-visita' })).toEqual({ interno: '/produto/cartao-visita' })
    expect(destinoDoBanner({ tipo: 'categoria', destino: 'adesivos' })).toEqual({ interno: '/produtos?categoria=adesivos' })
    expect(destinoDoBanner({ tipo: 'oferta', destino: 'natal' })).toEqual({ interno: '/oferta/natal' })
    expect(destinoDoBanner({ tipo: 'link', destino: '/pagina/sobre' })).toEqual({ interno: '/pagina/sobre' })
    expect(destinoDoBanner({ tipo: 'link', destino: 'https://exemplo.com' })).toEqual({ externo: 'https://exemplo.com' })
    expect(destinoDoBanner({ tipo: 'whatsapp', destino: 'Oi' })).toHaveProperty('externo')
    expect(destinoDoBanner({ tipo: 'whatsapp', destino: '' }, false)).toBeNull()
  })

  it('recusa links perigosos ou sem destino', () => {
    expect(destinoDoBanner({ tipo: 'link', destino: 'javascript:alert(1)' })).toBeNull()
    expect(destinoDoBanner({ tipo: 'link', destino: '//evil.com' })).toBeNull()
    expect(destinoDoBanner({ tipo: 'produto', destino: '' })).toBeNull()
  })
})
