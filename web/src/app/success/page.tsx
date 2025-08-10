// Description: Success landing – verifies session, sets cookie via /api/verify, then redirects
"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CopyLicenseButton } from '@/components/ui/copy-license'

export default function SuccessPage() {
  const router = useRouter()
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('session_id')
    if (!id) { router.replace('/compare'); return }
    fetch(`/api/verify?session_id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        const token = d?.token as string | undefined
        if (token) {
          try { localStorage.setItem('otm_license', token) } catch {}
        }
        router.replace('/compare')
      })
      .catch(() => router.replace('/compare'))
  }, [router])
  return (
    <div className="p-8 max-w-xl">
      <div className="text-lg mb-2">Finalizing purchase…</div>
      <div className="text-sm text-white/70">If you are not redirected automatically, you can now copy your license token and return to the app.</div>
      <div className="mt-3"><CopyLicenseButton /></div>
    </div>
  )
}


