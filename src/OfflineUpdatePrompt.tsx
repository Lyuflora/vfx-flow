import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function OfflineUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onNeedRefresh() { setDismissed(false) },
    onOfflineReady() { setOfflineReady(true) },
  })

  if (dismissed || (!needRefresh && !offlineReady)) return null
  return <div className="offline-update-prompt" role="status"><div><strong>{needRefresh ? 'An updated version of VFX / FLOW is available.' : 'VFX / FLOW is ready to use offline.'}</strong><small>{needRefresh ? 'Your saved browser data stays in place until you choose to update.' : 'Your task data remains on this device.'}</small></div>{needRefresh ? <button type="button" className="primary-button compact" onClick={() => updateServiceWorker(true)}><RefreshCw size={13} />Update now</button> : <button type="button" className="icon-button" title="Dismiss" onClick={() => setDismissed(true)}><X size={14} /></button>}<button type="button" className="icon-button" title="Later" onClick={() => setDismissed(true)}><X size={14} /></button></div>
}
