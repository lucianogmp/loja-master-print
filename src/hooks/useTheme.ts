import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

// Mesma chave e mesmo comportamento do tema do ERP.
const STORAGE_KEY = 'master-print-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const salvo = window.localStorage.getItem(STORAGE_KEY)
    if (salvo === 'dark' || salvo === 'light') return salvo
  } catch {
    // sem armazenamento: usa a preferência do aparelho
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  const raiz = document.documentElement
  raiz.dataset.theme = theme
  raiz.classList.toggle('light', theme === 'light')
  raiz.classList.toggle('dark', theme === 'dark')
  raiz.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fbff')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignora: o tema vale só nesta visita
    }
  }, [theme])

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => setTheme((atual) => (atual === 'dark' ? 'light' : 'dark')),
  }
}
