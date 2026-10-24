import { useEffect, useState } from 'react'
import { erp } from './erp'

// true quando há login do ERP (dono/admin) neste navegador — usado só para mostrar o atalho "Administração".
export function useEhAdmin() {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    const aplicar = (s: { user: { app_metadata?: { role?: string } } } | null) => {
      const papel = s?.user.app_metadata?.role
      setAdmin(papel === 'dono' || papel === 'admin')
    }
    erp.auth.getSession().then(({ data }) => aplicar(data.session))
    const { data } = erp.auth.onAuthStateChange((_e, s) => aplicar(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return admin
}
