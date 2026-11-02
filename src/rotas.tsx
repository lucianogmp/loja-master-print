import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import type { Handle } from './lib/telas'
import Raiz from './components/Raiz'
import LojaShell from './components/LojaShell'
import AuthLayout from './components/AuthLayout'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import ProdutoPage from './pages/ProdutoPage'
import Buscar from './pages/Buscar'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import Atendimento from './pages/Atendimento'
import Entrar from './pages/Entrar'
import Cadastro from './pages/Cadastro'
import ConfirmeEmail from './pages/ConfirmeEmail'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import ContaLayout from './components/ContaLayout'
import Pedidos from './pages/Pedidos'
import PedidoDetalhe from './pages/PedidoDetalhe'
import Conta from './pages/Conta'
import ContaDados from './conta/ContaDados'
import ContaEnderecos from './conta/ContaEnderecos'
import ContaSeguranca from './conta/ContaSeguranca'
import ContaPrivacidade from './conta/ContaPrivacidade'
import PaginaTexto from './pages/PaginaTexto'
import NaoEncontrada from './pages/NaoEncontrada'

const AdminLayout = lazy(() => import('./admin/AdminLayout'))

// handle: metadados de cada tela para a casca da loja (aba dona, nível, título, barra) — ver src/lib/telas.ts
const h = (handle: Handle) => handle

export const rotas: RouteObject[] = [
  {
    element: <Raiz />,
    children: [
      {
        element: <LojaShell />,
        children: [
          { index: true, element: <Home />, handle: h({ nivel: 'raiz', aba: 'inicio', chips: true }) },
          { path: 'buscar', element: <Buscar />, handle: h({ nivel: 'raiz', aba: 'buscar' }) },
          { path: 'produtos', element: <Catalogo />, handle: h({ nivel: 'sub', aba: 'buscar', titulo: 'Produtos', chips: true }) },
          { path: 'produto/:slug', element: <ProdutoPage />, handle: h({ nivel: 'sub', aba: 'buscar', titulo: 'Produto', semWhatsApp: true }) },
          { path: 'carrinho', element: <Carrinho />, handle: h({ nivel: 'raiz', aba: 'carrinho' }) },
          { path: 'checkout', element: <Checkout />, handle: h({ nivel: 'sub', aba: 'carrinho', titulo: 'Finalizar pedido', semBarra: true }) },
          {
            element: <ContaLayout />,
            children: [
              { path: 'pedidos', element: <Pedidos />, handle: h({ nivel: 'raiz', aba: 'pedidos' }) },
              { path: 'pedidos/:numero', element: <PedidoDetalhe />, handle: h({ nivel: 'sub', aba: 'pedidos', titulo: 'Pedido', semWhatsApp: true }) },
              { path: 'conta', element: <Conta />, handle: h({ nivel: 'raiz', aba: 'conta' }) },
              { path: 'conta/dados', element: <ContaDados />, handle: h({ nivel: 'sub', aba: 'conta', titulo: 'Meus dados', semWhatsApp: true }) },
              { path: 'conta/enderecos', element: <ContaEnderecos />, handle: h({ nivel: 'sub', aba: 'conta', titulo: 'Endereços', semWhatsApp: true }) },
              { path: 'conta/seguranca', element: <ContaSeguranca />, handle: h({ nivel: 'sub', aba: 'conta', titulo: 'Segurança', semWhatsApp: true }) },
              { path: 'conta/privacidade', element: <ContaPrivacidade />, handle: h({ nivel: 'sub', aba: 'conta', titulo: 'Privacidade' }) },
            ],
          },
          { path: 'atendimento', element: <Atendimento />, handle: h({ nivel: 'sub', aba: 'conta', titulo: 'Atendimento', semWhatsApp: true }) },
          { path: 'pagina/:slug', element: <PaginaTexto />, handle: h({ nivel: 'sub', titulo: 'Página' }) },
          { path: '*', element: <NaoEncontrada />, handle: h({ nivel: 'sub', titulo: 'Página não encontrada' }) },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: 'entrar', element: <Entrar /> },
          { path: 'cadastro', element: <Cadastro /> },
          { path: 'confirme-email', element: <ConfirmeEmail /> },
          { path: 'esqueci-senha', element: <EsqueciSenha /> },
          { path: 'redefinir-senha', element: <RedefinirSenha /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<div className="container secao">Carregando...</div>}>
            <AdminLayout />
          </Suspense>
        ),
      },
    ],
  },
]
