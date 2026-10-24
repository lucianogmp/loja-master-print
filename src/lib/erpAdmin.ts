import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { erp } from './erp'

// true quando há login do ERP (dono/admin) neste navegador — usado só para mostrar o atalho "Administração".
export function useEhAdmin() {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    const aplicar = (s: Session | null) => {
      const papel = (s?.user.app_metadata as { role?: string } | undefined)?.role
      setAdmin(papel === 'dono' || papel === 'admin')
    }
    erp.auth.getSession().then(({ data }) => aplicar(data.session))
    const { data } = erp.auth.onAuthStateChange((_e, s) => aplicar(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return admin
}
