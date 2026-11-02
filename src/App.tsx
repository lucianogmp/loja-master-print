import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { rotas } from './rotas'

const router = createBrowserRouter(rotas)

export default function App() {
  return <RouterProvider router={router} />
}
