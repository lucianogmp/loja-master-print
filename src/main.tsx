import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CatalogoProvider } from './lib/catalogo'
import { CartProvider } from './lib/cart'
import { AuthProvider } from './lib/auth'
import { SiteProvider } from './lib/site'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><SiteProvider><CatalogoProvider><CartProvider>
        <App />
      </CartProvider></CatalogoProvider></SiteProvider></AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
