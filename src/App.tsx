import { lazy, Suspense } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import ProdutoPage from './pages/ProdutoPage'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import Atendimento from './pages/Atendimento'
import Entrar from './pages/Entrar'
import Cadastro from './pages/Cadastro'
import Conta from './pages/Conta'

const AdminLayout = lazy(() => import('./admin/AdminLayout'))

function NaoEncontrada() {
  return (
    <div className="container secao centro">
      <h1 className="titulo-pagina">Página não encontrada</h1>
      <Link to="/" className="btn btn-primario">
        Voltar ao início
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="produtos" element={<Catalogo />} />
        <Route path="produto/:slug" element={<ProdutoPage />} />
        <Route path="carrinho" element={<Carrinho />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="entrar" element={<Entrar />} />
        <Route path="cadastro" element={<Cadastro />} />
        <Route path="conta" element={<Conta />} />
        <Route path="atendimento" element={<Atendimento />} />
        <Route path="admin" element={<Suspense fallback={<div className="container secao">Carregando...</div>}><AdminLayout /></Suspense>} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
